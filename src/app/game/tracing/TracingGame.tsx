"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandMark from "@/components/BrandMark";
import Confetti from "@/components/Confetti";
import GameShell from "@/components/GameShell";
import LevelPicker from "@/components/LevelPicker";
import ResultActions from "@/components/ResultActions";
import ResultStat from "@/components/ResultStat";
import SessionStars from "@/components/SessionStars";
import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/language";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import { useSpeakAfterSound } from "@/lib/speakAfterSound";
import { getProgress, getUnassignedGameProgress, saveTracingResult } from "@/lib/storage";
import type { Stars } from "@/lib/difficulty";
import {
  clampTracingLevel,
  createTracingSession,
  isTracingComplete,
  nearestOnPath,
  tracingAccuracy,
  tracingPath,
  tracingSessionStars,
  tracingStars,
  TRACING_EXERCISES_PER_SESSION,
  TRACING_LEVELS,
  TRACING_MAX_LEVEL,
  TRACING_MAX_SKIP,
  type TracingExercise,
  type TracingLevel,
  type TracingPoint,
} from "@/lib/tracingGame";

type Phase = "intro" | "playing" | "results";
type Solved = { stars: number; accuracy: number };
/** Lo que se le dice al niño debajo del tablero, si hay algo que decirle. */
type Hint = "start" | "off" | "unfinished" | null;

/** Un punto nuevo se guarda solo si el dedo se movió algo: el trazo no engorda. */
const MIN_TRACE_STEP = 0.9;

export default function TracingGame() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState<TracingLevel>(1);
  const [session, setSession] = useState<TracingExercise[]>([]);
  const [index, setIndex] = useState(0);
  const [trace, setTrace] = useState<TracingPoint[]>([]);
  const [offPath, setOffPath] = useState(false);
  const [hint, setHint] = useState<Hint>(null);
  const [solved, setSolved] = useState<Solved | null>(null);
  const [stars, setStars] = useState(0);
  const [bestAccuracy, setBestAccuracy] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // El escalón elegido en la introducción, el más alto abierto, y el aviso de
  // haber tocado uno cerrado. El nivel elegido no se mueve durante la sesión:
  // `level` se fija al empezar y solo cambia volviendo a la introducción.
  const [unlocked, setUnlocked] = useState<TracingLevel>(1);
  const [selectedLevel, setSelectedLevel] = useState<TracingLevel>(1);
  const [lockedHint, setLockedHint] = useState<TracingLevel | null>(null);
  const [sessionStars, setSessionStars] = useState<Stars>(0);
  const [openedLevel, setOpenedLevel] = useState<TracingLevel | null>(null);

  // Lo guardado se lee al montar y no al pulsar Comenzar: el selector tiene
  // que enseñar los candados antes de que nadie elija nada.
  useEffect(() => {
    const stored = getUnassignedGameProgress(getProgress(), "tracing");
    const open = clampTracingLevel(stored.unlocked);
    setUnlocked(open);
    // El último elegido, salvo que fuera más alto de lo que hoy está abierto.
    setSelectedLevel(clampTracingLevel(Math.min(stored.difficulty, open)));
  }, []);

  const boardRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const reachedRef = useRef(0);
  const insideRef = useRef(0);
  const totalRef = useRef(0);
  const { speakAfterSound, cancel: cancelSpeaking } =
    useSpeakAfterSound(language);

  const exercise = session[index];
  const path = useMemo(
    () => (exercise ? tracingPath(exercise.pathType) : []),
    [exercise],
  );
  const tolerance = TRACING_LEVELS[level].tolerance;

  // La ayuda y la confirmación de salida se superponen: soltar el trazo a
  // medias y callar la palabra pendiente deja la partida quieta mientras se
  // lee o se decide, sin tocar la fase.
  const handleOverlayOpenChange = useCallback(
    (open: boolean) => {
      if (!open) return;
      drawingRef.current = false;
      pointerIdRef.current = null;
      cancelSpeaking();
    },
    [cancelSpeaking],
  );

  const resetTrace = () => {
    drawingRef.current = false;
    pointerIdRef.current = null;
    reachedRef.current = 0;
    insideRef.current = 0;
    totalRef.current = 0;
    setTrace([]);
    setOffPath(false);
  };

  const startGame = () => {
    // El nivel es el que se eligió en el selector, y se queda fijo hasta que
    // la sesión termine: el juego ya no sube ni baja la dificultad solo.
    const startingLevel = selectedLevel;
    cancelSpeaking();
    resetTrace();
    setLevel(startingLevel);
    setSession(createTracingSession(startingLevel));
    setSessionStars(0);
    setOpenedLevel(null);
    setLockedHint(null);
    setIndex(0);
    setSolved(null);
    setStars(0);
    setBestAccuracy(0);
    setAttempts(0);
    setHint(null);
    setPhase("playing");
  };

  const pointFromEvent = (event: React.PointerEvent<SVGSVGElement>) => {
    const board = boardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    // El tablero es cuadrado, así que las dos escalas son la misma y una
    // distancia diagonal significa lo mismo que una vertical.
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (solved || !exercise) return;
    const point = pointFromEvent(event);
    if (!point) return;

    // Se empieza en la figura, no donde se quiera: el trazo es un recorrido.
    const start = path[0];
    if (Math.hypot(point.x - start.x, point.y - start.y) > tolerance * 1.4) {
      setHint("start");
      return;
    }

    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Sin captura el gesto sigue funcionando mientras el dedo no salga.
    }
    pointerIdRef.current = event.pointerId;
    drawingRef.current = true;
    reachedRef.current = 0;
    insideRef.current = 1;
    totalRef.current = 1;
    setTrace([point]);
    setOffPath(false);
    setHint(null);
    playTapSound();
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current || event.pointerId !== pointerIdRef.current) return;
    const point = pointFromEvent(event);
    if (!point) return;

    const { index: nearest, distance } = nearestOnPath(path, point);
    const inside = distance <= tolerance;
    totalRef.current += 1;
    if (inside) insideRef.current += 1;
    setOffPath(!inside);
    setHint(inside ? null : "off");

    // Avanzar exige ir seguido: un salto largo hacia el final no cuenta, así
    // que llegar al destino por el aire no termina el ejercicio.
    if (inside && nearest <= reachedRef.current + TRACING_MAX_SKIP) {
      reachedRef.current = Math.max(reachedRef.current, nearest);
    }

    setTrace((current) => {
      const last = current[current.length - 1];
      if (
        last &&
        Math.hypot(point.x - last.x, point.y - last.y) < MIN_TRACE_STEP
      ) {
        return current;
      }
      return [...current, point];
    });

    if (isTracingComplete(reachedRef.current)) finishTrace();
  };

  const finishTrace = () => {
    if (!exercise) return;
    drawingRef.current = false;
    pointerIdRef.current = null;

    const accuracy = tracingAccuracy(insideRef.current, totalRef.current);
    setSolved({ stars: tracingStars(accuracy), accuracy });
    setAttempts((current) => current + 1);
    setOffPath(false);
    setHint(null);
    playCorrectSound();
    // La palabra de la figura de salida es lo que se está aprendiendo, y se
    // oye cuando el sonido de acierto ya ha terminado.
    speakAfterSound(exercise.start.word[language]);
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerId !== pointerIdRef.current) return;
    if (!drawingRef.current || solved) return;

    // Soltó antes de llegar: no se castiga, se recoge el trazo y se vuelve a
    // empezar el mismo camino.
    drawingRef.current = false;
    pointerIdRef.current = null;
    setAttempts((current) => current + 1);
    setHint("unfinished");
    setTrace([]);
    setOffPath(false);
    playWrongSound();
  };

  const goNext = () => {
    if (!solved) return;
    const earned = stars + solved.stars;
    const best = Math.max(bestAccuracy, solved.accuracy);
    setStars(earned);
    setBestAccuracy(best);
    cancelSpeaking();
    resetTrace();
    setSolved(null);
    setHint(null);

    if (index + 1 < session.length) {
      setIndex(index + 1);
      return;
    }

    // La sesión llegó al final, así que hay valoración: la media de estrellas
    // por trazo decide cuántas valen los cinco juntos. Abandonar a mitad no
    // pasa por aquí y por eso no desbloquea nada.
    const rating = tracingSessionStars(earned, session.length, session.length);
    const nextUnlocked =
      rating >= 2 ? clampTracingLevel(Math.max(unlocked, level + 1)) : unlocked;

    saveTracingResult({
      playedLevel: level,
      sessionStars: rating,
      exerciseStars: earned,
      completed: session.length,
      accuracy: best,
      attempts,
      playedAt: new Date().toISOString(),
    });

    setSessionStars(rating);
    // Solo se anuncia lo que se acaba de abrir, no lo que ya estaba abierto.
    setOpenedLevel(nextUnlocked > unlocked ? nextUnlocked : null);
    setUnlocked(nextUnlocked);
    setPhase("results");
    playCelebrationSound();
  };

  /**
   * Volver a la introducción, que es donde está el selector.
   *
   * El botón de repetir de los resultados no relanza la misma sesión a ciegas:
   * si se acaba de abrir un nivel, lo que quiere el niño es probarlo, y la
   * única forma de elegirlo es esta pantalla. Empezar sigue a un toque.
   */
  const backToIntro = () => {
    cancelSpeaking();
    resetTrace();
    setSolved(null);
    setHint(null);
    setLockedHint(null);
    setPhase("intro");
  };

  const pickLevel = (option: TracingLevel) => {
    if (option > unlocked) {
      // Un nivel cerrado no se elige: se explica cómo se abre.
      setLockedHint(option);
      playWrongSound();
      return;
    }
    setLockedHint(null);
    setSelectedLevel(option);
    playTapSound();
  };

  const retry = () => {
    cancelSpeaking();
    resetTrace();
    setSolved(null);
    setHint(null);
  };

  return (
    <GameShell
      intro={{
        emoji: "✏️",
        title: t("tracingTitle"),
        goal: t("tracingIntro"),
        howTo: t("tracingHowTo"),
        example: <TracingExample />,
      }}
      showIntro={phase === "intro"}
      startLabel={t("tracingStart")}
      onStart={startGame}
      confirmExit={phase === "playing"}
      onOverlayOpenChange={handleOverlayOpenChange}
      beforeStart={
        <LevelPicker
          maxLevel={TRACING_MAX_LEVEL}
          unlocked={unlocked}
          selected={selectedLevel}
          lockedHint={lockedHint}
          onPick={(option) => pickLevel(clampTracingLevel(option))}
        />
      }
    >
      {phase === "playing" && exercise && (
        <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-1.5 pt-2 text-center sm:gap-3 sm:pt-4">
          <h1 className="text-base font-extrabold text-ink sm:text-2xl">
            {t("tracingInstruction")}
          </h1>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink/45 sm:text-sm">
            {t("tracingLevelLabel", { level })} ·{" "}
            {t("tracingExercise", {
              current: index + 1,
              total: session.length,
            })}
          </p>

          <div className="relative w-full max-w-[min(24rem,calc(100svh-13rem))]">
            <svg
              ref={boardRef}
              viewBox="0 0 100 100"
              className="tracing-board w-full rounded-3xl border-2 border-ink/10 bg-white shadow-sm"
              role="img"
              aria-label={t("tracingPathAria", {
                start: exercise.start.word[language],
                target: exercise.target.word[language],
              })}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/*
                El carril: la zona de tolerancia se ve, no se adivina. Un niño
                que ve el ancho del camino sabe cuánto puede desviarse.
              */}
              <polyline
                points={svgPoints(path)}
                fill="none"
                stroke="currentColor"
                className={offPath ? "text-coralsoft" : "text-skysoft"}
                strokeWidth={tolerance * 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={svgPoints(path)}
                fill="none"
                stroke="currentColor"
                className={offPath ? "text-coral" : "text-sky"}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeDasharray="0.1 5"
              />
              {trace.length > 1 && (
                <polyline
                  points={svgPoints(trace)}
                  fill="none"
                  stroke="currentColor"
                  className="text-sun"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              <Figure
                point={path[0]}
                emoji={exercise.start.emoji}
                tone="start"
              />
              <Figure
                point={path[path.length - 1]}
                emoji={exercise.target.emoji}
                tone="target"
              />
            </svg>

            {solved && (
              <SolvedCard
                solved={solved}
                exercise={exercise}
                language={language}
                onNext={goNext}
                onRetry={retry}
              />
            )}
          </div>

          {/*
            El aviso vive en una línea de alto fijo: aparecer y desaparecer no
            puede mover el tablero mientras el dedo está encima de él.
          */}
          <p
            className="flex min-h-8 items-center text-sm font-extrabold text-ink/60 sm:text-base"
            role="status"
            aria-live="polite"
          >
            {hint === "start" &&
              t("tracingStartHint", { word: exercise.start.word[language] })}
            {hint === "off" && t("tracingBackToPath")}
            {hint === "unfinished" && t("tracingUnfinished")}
          </p>
        </section>
      )}

      {phase === "results" && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <BrandMark
            size={140}
            className="shadow-[0_14px_40px_rgba(255,196,0,0.2)]"
          />
          <div>
            <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">
              {t("tracingResultsTitle")}
            </h1>
            <p className="mt-2 text-xl font-semibold text-ink/65">
              {t("tracingResultsText", {
                total: TRACING_EXERCISES_PER_SESSION,
              })}
            </p>
          </div>
          {/* Aparte de las de cada trazo, que van en su tarjeta de abajo. */}
          <SessionStars stars={sessionStars} openedLevel={openedLevel} />

          <div className="grid w-full grid-cols-3 gap-3">
            <ResultStat
              tone="sun"
              label={t("tracingExerciseStars")}
              value={stars}
            />
            <ResultStat
              tone="sun"
              label={t("tracingAccuracy")}
              value={`${bestAccuracy}%`}
            />
            <ResultStat
              tone="sun"
              label={t("tracingLevelStat")}
              value={`${level}/${TRACING_MAX_LEVEL}`}
            />
          </div>
          <ResultActions
            playAgainLabel={t("tracingPlayAgain")}
            onPlayAgain={backToIntro}
          />
        </section>
      )}
    </GameShell>
  );
}

function svgPoints(points: TracingPoint[]): string {
  return points
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
}

/** Las dos figuras del camino: salida y destino, cada una en su color. */
function Figure({
  point,
  emoji,
  tone,
}: {
  point: TracingPoint;
  emoji: string;
  tone: "start" | "target";
}) {
  if (!point) return null;

  return (
    <g aria-hidden="true">
      <circle
        cx={point.x}
        cy={point.y}
        r="9.5"
        className={
          tone === "start"
            ? "fill-sunsoft stroke-sun"
            : "fill-mintsoft stroke-mint"
        }
        strokeWidth="1.6"
      />
      <text
        x={point.x}
        y={point.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
      >
        {emoji}
      </text>
    </g>
  );
}

/**
 * Lo que aparece al llegar al destino: las estrellas que se ganaron, la palabra
 * que se acaba de oír y su traducción pequeña debajo. Se superpone al tablero
 * en vez de empujarlo, para que el camino recién trazado siga viéndose detrás.
 */
function SolvedCard({
  solved,
  exercise,
  language,
  onNext,
  onRetry,
}: {
  solved: Solved;
  exercise: TracingExercise;
  language: Language;
  onNext: () => void;
  onRetry: () => void;
}) {
  const { t } = useLanguage();
  const other: Language = language === "en" ? "es" : "en";

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-cream/85 p-4 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
    >
      <Confetti />
      <Stars
        count={solved.stars}
        label={t("tracingStarsAria", { stars: solved.stars })}
      />
      <div>
        <p className="text-3xl font-extrabold text-ink sm:text-4xl">
          {exercise.start.word[language]}
        </p>
        <p className="text-base font-semibold text-ink/50">
          {exercise.start.word[other]}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={onNext}
          className="min-h-12 w-full rounded-2xl border-b-8 border-b-[#d9a600] bg-sun px-6 text-lg font-extrabold text-ink active:scale-95 active:border-b-4"
        >
          {t("tracingNext")}
        </button>
        {solved.stars < 3 && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-12 w-full rounded-2xl border-2 border-ink/15 bg-white px-6 text-base font-extrabold text-ink active:scale-95"
          >
            {t("tracingRetry")}
          </button>
        )}
      </div>
    </div>
  );
}

function Stars({ count, label }: { count: number; label: string }) {
  return (
    <p
      className="flex gap-1 text-4xl leading-none sm:text-5xl"
      aria-label={label}
    >
      {[1, 2, 3].map((star) => (
        <span
          key={star}
          aria-hidden="true"
          className={star <= count ? "animate-pop" : "opacity-25 grayscale"}
        >
          ⭐
        </span>
      ))}
    </p>
  );
}

/**
 * Ejemplo estático de la intro: un camino punteado con su figura a cada lado y
 * un trazo a medias encima. No usa la geometría real; solo enseña la mecánica.
 */
function TracingExample() {
  const { t } = useLanguage();

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={t("tracingExampleAria")}
    >
      <span className="text-2xl" aria-hidden="true">
        🐕
      </span>
      <svg viewBox="0 0 60 12" className="h-6 w-28" aria-hidden="true">
        <line
          x1="4"
          y1="6"
          x2="56"
          y2="6"
          stroke="currentColor"
          className="text-sky"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="0.1 5"
        />
        <line
          x1="4"
          y1="6"
          x2="34"
          y2="6"
          stroke="currentColor"
          className="text-sun"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-2xl" aria-hidden="true">
        🐶
      </span>
    </div>
  );
}
