"use client";

import { useCallback, useEffect, useState } from "react";
import AudioButton from "@/components/AudioButton";
import BrandMark from "@/components/BrandMark";
import GameShell from "@/components/GameShell";
import LevelPicker from "@/components/LevelPicker";
import ResultActions from "@/components/ResultActions";
import ResultStat from "@/components/ResultStat";
import SessionStars from "@/components/SessionStars";
import type { Stars } from "@/lib/difficulty";
import { useGameTimers } from "@/lib/gameTimers";
import { useLanguage } from "@/lib/i18n";
import {
  buildColoringSession,
  clampColoringLevel,
  coloringAccuracy,
  coloringSessionStars,
  COLORING_COLORS,
  COLORING_FILL_MS,
  COLORING_MAX_LEVEL,
  COLORING_PICTURES_PER_SESSION,
  type ColorId,
  type ColoringLevel,
  type ColoringRound,
  type ColoringTask,
} from "@/lib/coloringGame";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import { useSpeakAfterSound } from "@/lib/speakAfterSound";
import {
  getProgress,
  getUnassignedGameProgress,
  saveColoringResult,
} from "@/lib/storage";

type Phase = "intro" | "playing" | "results";

export default function ColoringGame() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");

  const [rounds, setRounds] = useState<ColoringRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  /** Qué color lleva ya cada zona pintada de la lámina en curso. */
  const [filled, setFilled] = useState<Record<string, ColorId>>({});
  const [selected, setSelected] = useState<ColorId | null>(null);
  /** En los escalones hablados, qué zona toca ahora. */
  const [step, setStep] = useState(0);
  const [wrongRegion, setWrongRegion] = useState<string | null>(null);
  const [taps, setTaps] = useState(0);
  const [painted, setPainted] = useState(0);
  const [locked, setLocked] = useState(false);
  /** Aviso de "elige un color primero", que aparece y se va solo. */
  const [needsColor, setNeedsColor] = useState(false);

  const [level, setLevel] = useState<ColoringLevel>(1);
  const [unlocked, setUnlocked] = useState<ColoringLevel>(1);
  const [selectedLevel, setSelectedLevel] = useState<ColoringLevel>(1);
  const [lockedHint, setLockedHint] = useState<ColoringLevel | null>(null);
  const [sessionStars, setSessionStars] = useState<Stars>(0);
  const [openedLevel, setOpenedLevel] = useState<ColoringLevel | null>(null);
  const timers = useGameTimers();
  const { speakAfterSound, cancel: cancelSpeaking } =
    useSpeakAfterSound(language);

  // Lo guardado se lee al montar y no al pulsar Comenzar: el selector tiene
  // que enseñar los candados antes de que nadie elija nada.
  useEffect(() => {
    const stored = getUnassignedGameProgress(getProgress(), "coloring");
    const open = clampColoringLevel(stored.unlocked);
    setUnlocked(open);
    setSelectedLevel(clampColoringLevel(Math.min(stored.difficulty, open)));
  }, []);

  // Con la ayuda o la confirmación de salida abiertas la lámina queda quieta:
  // la espera que enseña el color recién puesto no puede correr detrás de un
  // overlay y saltar de zona mientras el niño lee.
  const handleOverlayOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        timers.freeze();
        cancelSpeaking();
      } else {
        timers.resume();
      }
    },
    [timers, cancelSpeaking],
  );

  const round = rounds[roundIndex];
  const currentTask: ColoringTask | undefined =
    round && round.mode === "spoken" ? round.tasks[step] : undefined;

  /** Lo que se pide ahora, escrito; en los escalones hablados también se dice. */
  const spokenPrompt = currentTask
    ? t("coloringSpokenInstruction", {
        region: currentTask.label[language],
        color: COLORING_COLORS[currentTask.colorId].label[language],
      })
    : "";

  const startGame = () => {
    timers.clear();
    cancelSpeaking();
    const startingLevel = selectedLevel;
    const session = buildColoringSession(startingLevel);
    setLevel(startingLevel);
    setRounds(session);
    setRoundIndex(0);
    setFilled({});
    setSelected(null);
    setStep(0);
    setWrongRegion(null);
    setTaps(0);
    setPainted(0);
    setLocked(false);
    setNeedsColor(false);
    setSessionStars(0);
    setOpenedLevel(null);
    setLockedHint(null);
    setPhase("playing");
  };

  const pickColor = (colorId: ColorId) => {
    if (locked) return;
    setNeedsColor(false);
    setSelected(colorId);
    playTapSound();
  };

  const handleRegionTap = (task: ColoringTask) => {
    if (locked || !round || phase !== "playing") return;
    if (filled[task.id]) return;

    // Sin color elegido no hay nada que pintar; se dice en vez de no hacer
    // nada, que es lo que deja al niño tocando la pantalla sin entender.
    if (!selected) {
      setNeedsColor(true);
      playTapSound();
      return;
    }

    const isTheRegionAsked =
      round.mode === "key" || task.id === currentTask?.id;
    const correct = isTheRegionAsked && selected === task.colorId;
    const nextTaps = taps + 1;
    setTaps(nextTaps);

    if (!correct) {
      playWrongSound();
      setWrongRegion(task.id);
      timers.later(() => setWrongRegion(null), 500);
      return;
    }

    const nextFilled = { ...filled, [task.id]: task.colorId };
    const nextPainted = painted + 1;
    setFilled(nextFilled);
    setPainted(nextPainted);
    setLocked(true);
    playCorrectSound();

    const done = Object.keys(nextFilled).length >= round.tasks.length;

    timers.later(() => {
      setLocked(false);
      if (done) {
        finishRound(nextTaps, nextPainted);
        return;
      }
      if (round.mode === "spoken") {
        const nextStep = step + 1;
        setStep(nextStep);
        // La siguiente consigna se dice sola, pero solo porque viene detrás
        // de un acierto, que es un gesto: en iOS la voz no arranca de otra
        // forma. `useSpeakAfterSound` ya espera al sonido de acierto.
        const next = round.tasks[nextStep];
        if (next) {
          speakAfterSound(
            t("coloringSpokenInstruction", {
              region: next.label[language],
              color: COLORING_COLORS[next.colorId].label[language],
            }),
          );
        }
      }
    }, COLORING_FILL_MS);
  };

  /** Lámina terminada: o viene la siguiente o se acaba la sesión. */
  const finishRound = (finalTaps: number, finalPainted: number) => {
    if (roundIndex + 1 < rounds.length) {
      setRoundIndex(roundIndex + 1);
      setFilled({});
      setSelected(null);
      setStep(0);
      setNeedsColor(false);
      playCelebrationSound();
      return;
    }
    finishSession(finalTaps, finalPainted);
  };

  /**
   * La sesión llegó al final, así que hay valoración. Abandonar a mitad no
   * pasa por aquí y por eso no guarda ni desbloquea nada.
   */
  const finishSession = (finalTaps: number, finalPainted: number) => {
    const accuracy = coloringAccuracy(finalTaps, finalPainted);
    const rating = coloringSessionStars(accuracy, true);
    const nextUnlocked =
      rating >= 2 ? clampColoringLevel(Math.max(unlocked, level + 1)) : unlocked;

    saveColoringResult({
      playedLevel: level,
      sessionStars: rating,
      accuracy,
      pictures: rounds.length,
      playedAt: new Date().toISOString(),
    });

    setSessionStars(rating);
    setOpenedLevel(nextUnlocked > unlocked ? nextUnlocked : null);
    setUnlocked(nextUnlocked);
    setPhase("results");
    playCelebrationSound();
  };

  /**
   * Volver a la introducción, donde está el selector, igual que en Trazos y
   * en Parejas: si se acaba de abrir un nivel, lo que se quiere es probarlo.
   */
  const backToIntro = () => {
    timers.clear();
    cancelSpeaking();
    setLockedHint(null);
    setPhase("intro");
  };

  const pickLevel = (option: ColoringLevel) => {
    if (option > unlocked) {
      setLockedHint(option);
      playWrongSound();
      return;
    }
    setLockedHint(null);
    setSelectedLevel(option);
    playTapSound();
  };

  const accuracy = coloringAccuracy(taps, painted);

  return (
    <GameShell
      intro={{
        emoji: "🖍️",
        title: t("coloringTitle"),
        goal: t("coloringIntro"),
        howTo: t("coloringHowTo"),
        example: <ColoringExample />,
      }}
      showIntro={phase === "intro"}
      startLabel={t("coloringStart")}
      onStart={startGame}
      confirmExit={phase === "playing"}
      onOverlayOpenChange={handleOverlayOpenChange}
      beforeStart={
        <LevelPicker
          maxLevel={COLORING_MAX_LEVEL}
          unlocked={unlocked}
          selected={selectedLevel}
          lockedHint={lockedHint}
          onPick={(option) => pickLevel(clampColoringLevel(option))}
        />
      }
    >
      {phase === "playing" && round && (
        <section className="coloring-play mx-auto flex w-full max-w-xl flex-col items-center gap-2 pt-2 text-center sm:min-h-[calc(100svh-6rem)] sm:max-w-3xl sm:justify-center sm:gap-4 sm:pt-4">
          <p className="text-sm font-extrabold text-ink/70 sm:text-base">
            {t("coloringProgress", {
              current: roundIndex + 1,
              total: rounds.length,
              level,
            })}
          </p>

          {/*
            Una sola línea de consigna, y ocupa sitio fijo tenga una u otra
            forma: si cambiara de alto entre escalones, el dibujo saltaría.
          */}
          <div className="flex min-h-16 w-full items-center justify-center gap-3">
            <h1 className="text-base font-extrabold leading-snug text-ink sm:text-2xl">
              {round.mode === "spoken" ? spokenPrompt : t("coloringKeyInstruction")}
            </h1>
            {round.mode === "spoken" && spokenPrompt && (
              <AudioButton
                text={spokenPrompt}
                label={t("coloringListenAria")}
              />
            )}
          </div>

          <div className="coloring-board w-full">
            <svg
              viewBox="0 0 100 100"
              className="h-auto w-full"
              role="group"
              aria-label={round.picture.name[language]}
            >
              {round.tasks.map((task) => {
                const paint = filled[task.id];
                return (
                  <g key={task.id}>
                    <path
                      d={task.path}
                      role="button"
                      tabIndex={paint ? -1 : 0}
                      aria-label={
                        paint
                          ? t("coloringRegionDone", {
                              region: task.label[language],
                              color: COLORING_COLORS[paint].label[language],
                            })
                          : task.label[language]
                      }
                      aria-disabled={paint ? true : undefined}
                      onClick={() => handleRegionTap(task)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleRegionTap(task);
                        }
                      }}
                      className={`cursor-pointer outline-none transition-[fill] duration-200 focus-visible:stroke-sky ${
                        wrongRegion === task.id ? "animate-shake" : ""
                      }`}
                      fill={paint ? COLORING_COLORS[paint].hex : "#ffffff"}
                      stroke="#171717"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    {/*
                      El número solo mientras la zona está sin pintar: puesto
                      encima del color sobraría, y sobre un morado oscuro ni
                      se leería.
                    */}
                    {round.mode === "key" && !paint && (
                      <text
                        x={task.labelAt.x}
                        y={task.labelAt.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="pointer-events-none select-none fill-ink/70 font-extrabold"
                        style={{ fontSize: "7px" }}
                        aria-hidden="true"
                      >
                        {task.key}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/*
            La paleta. En los escalones numerados cada ficha lleva su número,
            que es la mitad de la mecánica; en los hablados no, porque ahí el
            color se pide por su nombre.
          */}
          <div
            className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3"
            role="group"
            aria-label={t("coloringPaletteAria")}
          >
            {round.palette.map((colorId, index) => {
              const chosen = selected === colorId;
              return (
                <button
                  key={colorId}
                  type="button"
                  onClick={() => pickColor(colorId)}
                  aria-pressed={chosen}
                  aria-label={
                    round.mode === "key"
                      ? t("coloringSwatchKeyAria", {
                          key: index + 1,
                          color: COLORING_COLORS[colorId].label[language],
                        })
                      : COLORING_COLORS[colorId].label[language]
                  }
                  /*
                   * 48 px en móvil: con seis colores —el nivel 5— seis
                   * fichas de 56 no caben en 375 px y la última se iba sola
                   * a una segunda fila. 48 sigue por encima del objetivo
                   * táctil mínimo y las seis entran en una línea.
                   */
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border-4 text-lg font-extrabold text-white transition-transform active:scale-95 sm:h-16 sm:w-16 md:h-20 md:w-20 md:text-2xl ${
                    chosen
                      ? "border-ink shadow-lg ring-4 ring-sun"
                      : "border-ink/20 shadow-sm"
                  }`}
                  style={{ backgroundColor: COLORING_COLORS[colorId].hex }}
                >
                  {round.mode === "key" ? (
                    <span
                      aria-hidden="true"
                      className="[text-shadow:0_1px_3px_rgba(0,0,0,0.55)]"
                    >
                      {index + 1}
                    </span>
                  ) : (
                    <span aria-hidden="true">{chosen ? "✓" : ""}</span>
                  )}
                </button>
              );
            })}
          </div>

          <p
            className="flex min-h-6 items-center text-sm font-bold text-ink/60"
            role="status"
            aria-live="polite"
          >
            {needsColor ? t("coloringPickColorFirst") : ""}
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
              {t("coloringResultsTitle")}
            </h1>
            <p className="mt-2 text-xl font-semibold text-ink/65">
              {t("coloringResultsText", { total: rounds.length })}
            </p>
            <p className="mt-1 text-sm font-extrabold text-ink/70">
              {t("coloringLevelLabel", { level })}
            </p>
          </div>

          <SessionStars stars={sessionStars} openedLevel={openedLevel} />

          <div className="grid w-full grid-cols-3 gap-3">
            <ResultStat
              tone="berry"
              label={t("coloringPictures")}
              value={rounds.length}
            />
            <ResultStat
              tone="berry"
              label={t("coloringAreas")}
              value={painted}
            />
            <ResultStat
              tone="berry"
              label={t("coloringAccuracy")}
              value={`${accuracy}%`}
            />
          </div>
          <ResultActions
            playAgainLabel={t("coloringPlayAgain")}
            onPlayAgain={backToIntro}
          />
        </section>
      )}
    </GameShell>
  );
}

/**
 * Ejemplo estático de la intro: una zona ya pintada y otra todavía en blanco
 * con su número. No usa el generador real; solo enseña la mecánica.
 */
function ColoringExample() {
  const { t } = useLanguage();

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={t("coloringExampleAria")}
    >
      <svg viewBox="0 0 100 100" className="h-12 w-12" aria-hidden="true">
        <path
          d="M50 10 L92 44 L8 44 Z"
          fill={COLORING_COLORS.rojo.hex}
          stroke="#171717"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M16 44 H84 V92 H16 Z"
          fill="#ffffff"
          stroke="#171717"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="68"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-ink/70 font-extrabold"
          style={{ fontSize: "22px" }}
        >
          2
        </text>
      </svg>
      <span aria-hidden="true" className="text-xl">
        →
      </span>
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-xl border-4 border-ink/20 text-lg font-extrabold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]"
        style={{ backgroundColor: COLORING_COLORS.azul.hex }}
      >
        2
      </span>
    </div>
  );
}
