"use client";

import { useCallback, useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";
import GameShell from "@/components/GameShell";
import LevelPicker from "@/components/LevelPicker";
import ResultActions from "@/components/ResultActions";
import ResultStat from "@/components/ResultStat";
import SessionStars from "@/components/SessionStars";
import { useClockPause } from "@/lib/clockPause";
import type { Stars } from "@/lib/difficulty";
import { useGameTimers } from "@/lib/gameTimers";
import { useLanguage } from "@/lib/i18n";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import {
  clampVisualLevel,
  createFirstVisualCard,
  createNextVisualCard,
  formatVisualTime,
  visualAccuracy,
  visualSessionStars,
  VISUAL_ERROR_PENALTY_MS,
  VISUAL_LEVELS,
  VISUAL_MAX_LEVEL,
  VISUAL_ROUNDS,
  type VisualCard,
  type VisualLevel,
} from "@/lib/visualGame";
import {
  getProgress,
  getUnassignedGameProgress,
  saveVisualResult,
} from "@/lib/storage";
import { hexagonImage } from "@/data/categories";

type Phase = "intro" | "playing" | "results";
type Flash = { id: string; type: "correct" | "wrong" } | null;

export default function VisualGame() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");
  const [baseCard, setBaseCard] = useState<VisualCard | null>(null);
  const [playerCard, setPlayerCard] = useState<VisualCard | null>(null);
  const [targetId, setTargetId] = useState("");
  const [completed, setCompleted] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [flash, setFlash] = useState<Flash>(null);
  const [locked, setLocked] = useState(false);

  // El escalón de la partida en curso, fijado al empezar: el juego no lo sube
  // ni lo baja solo. Aparte, el elegido en el selector, el más alto abierto y
  // el aviso de haber tocado uno cerrado.
  const [level, setLevel] = useState<VisualLevel>(1);
  const [unlocked, setUnlocked] = useState<VisualLevel>(1);
  const [selectedLevel, setSelectedLevel] = useState<VisualLevel>(1);
  const [lockedHint, setLockedHint] = useState<VisualLevel | null>(null);
  const [sessionStars, setSessionStars] = useState<Stars>(0);
  const [openedLevel, setOpenedLevel] = useState<VisualLevel | null>(null);
  const timers = useGameTimers();

  // Lo guardado se lee al montar y no al pulsar Comenzar: el selector tiene
  // que enseñar los candados antes de que nadie elija nada.
  useEffect(() => {
    const stored = getUnassignedGameProgress(getProgress(), "visual");
    const open = clampVisualLevel(stored.unlocked);
    setUnlocked(open);
    // El último elegido, salvo que fuera más alto de lo que hoy está abierto.
    setSelectedLevel(clampVisualLevel(Math.min(stored.difficulty, open)));
  }, []);

  // Ni leer la ayuda ni dudar ante la confirmación de salida pueden costar
  // tiempo: el cronómetro se detiene mientras haya algo superpuesto y el
  // instante de inicio se desplaza al reanudar.
  const [paused, pauseClock] = useClockPause(
    useCallback((pausedMs: number) => {
      setStartedAt((current) => current + pausedMs);
      setNow(Date.now());
    }, []),
  );

  // Con la ayuda o la confirmación de salida abiertas la partida queda quieta:
  // además del cronómetro se congela la espera entre cartas, para que al
  // cerrar siga la misma carta.
  const handleOverlayOpenChange = useCallback(
    (open: boolean) => {
      if (open) timers.freeze();
      else timers.resume();
      pauseClock(open);
    },
    [timers, pauseClock],
  );

  useEffect(() => {
    if (phase !== "playing" || paused) return;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [phase, paused]);

  const startGame = () => {
    timers.clear();
    // El escalón es el elegido en el selector y se queda fijo hasta el final.
    const startingLevel = selectedLevel;
    const firstCard = createFirstVisualCard(startingLevel);
    const nextCard = createNextVisualCard(firstCard, 2, startingLevel);
    const start = Date.now();
    setLevel(startingLevel);
    setSessionStars(0);
    setOpenedLevel(null);
    setLockedHint(null);
    setBaseCard(firstCard);
    setPlayerCard(nextCard.card);
    setTargetId(nextCard.targetId);
    setCompleted(0);
    setErrors(0);
    setStartedAt(start);
    setNow(start);
    setFinalTime(0);
    setFlash(null);
    setLocked(false);
    setPhase("playing");
  };

  /**
   * La partida llegó a las diez rondas, así que hay valoración. Abandonar a
   * mitad no pasa por aquí y por eso no desbloquea nada ni guarda nada.
   *
   * El tiempo que se guarda es el que se enseña, penalizaciones incluidas: es
   * la marca que el jugador vio, y guardar otra distinta sería mentirle.
   */
  const finishGame = (finalErrors: number) => {
    const timeMs =
      Date.now() - startedAt + finalErrors * VISUAL_ERROR_PENALTY_MS;
    const finalAccuracy = visualAccuracy(finalErrors);
    const rating = visualSessionStars(finalAccuracy, true);
    const nextUnlocked =
      rating >= 2 ? clampVisualLevel(Math.max(unlocked, level + 1)) : unlocked;

    saveVisualResult({
      playedLevel: level,
      sessionStars: rating,
      timeMs,
      mistakes: finalErrors,
      playedAt: new Date().toISOString(),
    });

    setFinalTime(timeMs);
    setSessionStars(rating);
    // Solo se anuncia lo que se acaba de abrir, no lo que ya estaba abierto.
    setOpenedLevel(nextUnlocked > unlocked ? nextUnlocked : null);
    setUnlocked(nextUnlocked);
    setCompleted(VISUAL_ROUNDS);
    setLocked(false);
    setPhase("results");
    playCelebrationSound();
  };

  /**
   * Volver a la introducción, donde está el selector, igual que en Parejas: si
   * se acaba de abrir un nivel, lo que se quiere es probarlo, y solo se puede
   * elegir ahí. Empezar sigue estando a un toque.
   */
  const backToIntro = () => {
    timers.clear();
    setLockedHint(null);
    setPhase("intro");
  };

  const pickLevel = (option: VisualLevel) => {
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

  const handleTap = (symbolId: string) => {
    if (locked || !playerCard || phase !== "playing") return;

    if (symbolId !== targetId) {
      setErrors((current) => current + 1);
      setFlash({ id: symbolId, type: "wrong" });
      setLocked(true);
      playWrongSound();
      timers.later(() => {
        setFlash(null);
        setLocked(false);
      }, 350);
      return;
    }

    const nextCompleted = completed + 1;
    setCompleted(nextCompleted);
    setFlash({ id: symbolId, type: "correct" });
    setLocked(true);
    playCorrectSound();

    timers.later(() => {
      setFlash(null);
      if (nextCompleted >= VISUAL_ROUNDS) {
        finishGame(errors);
        return;
      }

      const next = createNextVisualCard(playerCard, playerCard.id + 1, level);
      setBaseCard(playerCard);
      setPlayerCard(next.card);
      setTargetId(next.targetId);
      setLocked(false);
    }, 400);
  };

  const elapsedTime =
    phase === "playing"
      ? Math.max(0, now - startedAt) + errors * VISUAL_ERROR_PENALTY_MS
      : finalTime;
  const accuracy = visualAccuracy(errors);

  return (
    <GameShell
      intro={{
        image: hexagonImage("visual"),
        title: t("visualTitle"),
        goal: t("visualIntro"),
        howTo: t("visualHowTo"),
        example: <VisualExample />,
      }}
      showIntro={phase === "intro"}
      startLabel={t("visualStart")}
      onStart={startGame}
      confirmExit={phase === "playing"}
      onOverlayOpenChange={handleOverlayOpenChange}
      beforeStart={
        <LevelPicker
          maxLevel={VISUAL_MAX_LEVEL}
          unlocked={unlocked}
          selected={selectedLevel}
          lockedHint={lockedHint}
          onPick={(option) => pickLevel(clampVisualLevel(option))}
        />
      }
    >
      {phase === "playing" && baseCard && playerCard && (
        <section className="mx-auto flex w-full max-w-6xl flex-col justify-center pb-2 pt-2 text-center sm:min-h-[calc(100svh-6rem)] sm:pt-4">
          <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
            <h1 className="text-base font-extrabold text-ink sm:text-2xl">
              {t("visualInstruction")}
            </h1>
            <p className="-mt-1 text-sm font-extrabold text-ink/70 sm:text-base">
              {t("visualLevelLabel", {
                level,
                symbols: VISUAL_LEVELS[level].symbols,
              })}
            </p>

            <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-5">
              <VisualCardView
                card={baseCard}
                label={t("visualReference")}
                language={language}
                interactive={false}
                flash={null}
                locked
                onTap={() => {}}
              />
              <VisualCardView
                card={playerCard}
                label={t("visualYourCard")}
                language={language}
                interactive
                flash={flash}
                locked={locked}
                onTap={handleTap}
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
              <SideMetric
                icon="⏱️"
                label={t("visualTime")}
                value={formatVisualTime(elapsedTime)}
              />
              <SideMetric
                icon="🎯"
                label={t("visualAccuracy")}
                value={`${accuracy}%`}
              />
              <SideMetric
                icon="🃏"
                label={t("visualCards")}
                value={`${Math.min(completed + 1, VISUAL_ROUNDS)}/${VISUAL_ROUNDS}`}
              />
              <SideMetric
                icon="❌"
                label={t("visualMistakes")}
                value={errors}
              />
            </div>
          </div>
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
              {t("visualResultsTitle")}
            </h1>
            <p className="mt-2 text-xl font-semibold text-ink/65">
              {t("visualResultsText", { total: VISUAL_ROUNDS })}
            </p>
            <p className="mt-1 text-base font-extrabold text-ink/70">
              {t("visualLevelLabel", {
                level,
                symbols: VISUAL_LEVELS[level].symbols,
              })}
            </p>
          </div>

          {/* Aparte del tiempo y los fallos, que van en sus tarjetas. */}
          <SessionStars stars={sessionStars} openedLevel={openedLevel} />

          <div className="grid w-full grid-cols-3 gap-3">
            <ResultStat
              tone="neutral"
              label={t("visualTime")}
              value={formatVisualTime(finalTime)}
            />
            <ResultStat
              tone="neutral"
              label={t("visualAccuracy")}
              value={`${accuracy}%`}
            />
            <ResultStat
              tone="neutral"
              label={t("visualMistakes")}
              value={errors}
            />
          </div>
          <ResultActions
            playAgainLabel={t("visualPlayAgain")}
            onPlayAgain={backToIntro}
          />
        </section>
      )}
    </GameShell>
  );
}

function VisualCardView({
  card,
  label,
  language,
  interactive,
  flash,
  locked,
  onTap,
}: {
  card: VisualCard;
  label: string;
  language: "en" | "es";
  interactive: boolean;
  flash: Flash;
  locked: boolean;
  onTap: (symbolId: string) => void;
}) {
  const borderClass = interactive ? "border-sky" : "border-[#e0a800]";
  const labelClass = interactive
    ? "border-sky bg-skysoft"
    : "border-[#e0a800] bg-sun";

  return (
    <div className="relative mx-auto w-full max-w-[42rem] pt-3">
      <p
        className={`absolute left-1/2 top-0 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border-2 px-5 py-1 text-sm font-extrabold text-ink shadow-sm sm:px-7 sm:text-base ${labelClass}`}
      >
        {label}
      </p>
      <div
        className={`visual-card-board relative aspect-[3/2] w-full overflow-hidden rounded-[2rem] border-4 bg-white shadow-xl sm:border-[6px] md:aspect-[4/3] ${borderClass}`}
      >
        {card.symbols.map((symbol) => {
          const isFlashing = flash?.id === symbol.id;
          const flashClass = isFlashing
            ? flash.type === "correct"
              ? "bg-mintsoft ring-4 ring-mint"
              : "animate-shake bg-coralsoft ring-4 ring-coral"
            : "";
          const sharedClass =
            "absolute flex h-[clamp(2.75rem,14vw,5.5rem)] w-[clamp(2.75rem,14vw,5.5rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl text-[clamp(2rem,10vw,4.25rem)] leading-none transition-transform md:h-[clamp(3rem,8vw,5.5rem)] md:w-[clamp(3rem,8vw,5.5rem)] md:text-[clamp(2.15rem,6vw,4.25rem)]";
          const style = {
            left: `${symbol.x}%`,
            top: `${symbol.y}%`,
          };
          const content = (
            <span
              aria-hidden="true"
              style={{
                transform: `rotate(${symbol.rotation}deg) scale(${symbol.scale})`,
              }}
            >
              {symbol.emoji}
            </span>
          );

          if (!interactive) {
            return (
              <span
                key={symbol.id}
                className={`${sharedClass} ${flashClass}`}
                style={style}
                role="img"
                aria-label={symbol.label[language]}
              >
                {content}
              </span>
            );
          }

          return (
            <button
              key={symbol.id}
              type="button"
              disabled={locked}
              onClick={() => onTap(symbol.id)}
              className={`${sharedClass} ${flashClass} active:scale-90 disabled:cursor-default`}
              style={style}
              aria-label={symbol.label[language]}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SideMetric({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="flex min-h-12 w-full flex-col items-center justify-center rounded-xl border-2 border-ink/10 bg-white px-0.5 py-1 text-center shadow-sm sm:min-h-16 sm:rounded-2xl"
      aria-label={`${label}: ${value}`}
    >
      <span className="text-base leading-none sm:text-xl" aria-hidden="true">
        {icon}
      </span>
      <p className="mt-1 text-sm font-extrabold leading-none tabular-nums text-ink sm:text-lg">
        {value}
      </p>
      <p className="mt-0.5 max-w-full overflow-hidden text-[0.6rem] font-bold leading-none text-ink/70 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

/**
 * Ejemplo estático de la intro: dos cartas que comparten un único símbolo, el
 * sol, resaltado en la segunda. No usa el generador real de cartas; solo
 * enseña la mecánica antes de la primera partida.
 */
function VisualExample() {
  const { t } = useLanguage();

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={t("visualExampleAria")}
    >
      <ExampleCard symbols={["🌙", "☀️", "🍎"]} />
      <span aria-hidden="true" className="text-xl font-extrabold text-ink/35">
        →
      </span>
      <ExampleCard symbols={["🌈", "🥕", "☀️"]} highlight="☀️" />
    </div>
  );
}

function ExampleCard({
  symbols,
  highlight,
}: {
  symbols: string[];
  highlight?: string;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-2xl border-2 border-ink/10 bg-cream px-2 py-1.5"
      aria-hidden="true"
    >
      {symbols.map((symbol, index) => (
        <span
          key={index}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ${
            symbol === highlight ? "border-2 border-mint bg-mintsoft" : ""
          }`}
        >
          {symbol}
        </span>
      ))}
    </div>
  );
}

