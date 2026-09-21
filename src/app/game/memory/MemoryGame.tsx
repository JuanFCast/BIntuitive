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
import { hexagonPoints } from "@/lib/hexagon";
import { useLanguage } from "@/lib/i18n";
import {
  clampMemoryLevel,
  createMemoryBoard,
  formatMemoryTime,
  memoryAccuracy,
  memorySessionStars,
  MEMORY_LEVELS,
  MEMORY_MATCH_MS,
  MEMORY_MAX_LEVEL,
  type MemoryCard,
  type MemoryLevel,
} from "@/lib/memoryGame";
import {
  getProgress,
  getUnassignedGameProgress,
  saveMemoryResult,
} from "@/lib/storage";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import { useSpeakAfterSound } from "@/lib/speakAfterSound";

type Phase = "intro" | "playing" | "results";

export default function MemoryGame() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");
  const [board, setBoard] = useState<MemoryCard[]>([]);
  /** Fichas destapadas ahora mismo: ninguna, una o la pareja que se compara. */
  const [flipped, setFlipped] = useState<string[]>([]);
  /** Símbolos ya resueltos: sus dos fichas se quedan a la vista. */
  const [matched, setMatched] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  // El escalón de la partida en curso, fijado al empezar: el juego no lo sube
  // ni lo baja solo. Aparte, el elegido en el selector, el más alto abierto y
  // el aviso de haber tocado uno cerrado.
  const [level, setLevel] = useState<MemoryLevel>(1);
  const [unlocked, setUnlocked] = useState<MemoryLevel>(1);
  const [selectedLevel, setSelectedLevel] = useState<MemoryLevel>(1);
  const [lockedHint, setLockedHint] = useState<MemoryLevel | null>(null);
  const [sessionStars, setSessionStars] = useState<Stars>(0);
  const [openedLevel, setOpenedLevel] = useState<MemoryLevel | null>(null);
  const timers = useGameTimers();

  // Lo guardado se lee al montar y no al pulsar Comenzar: el selector tiene
  // que enseñar los candados antes de que nadie elija nada.
  useEffect(() => {
    const stored = getUnassignedGameProgress(getProgress(), "memory");
    const open = clampMemoryLevel(stored.unlocked);
    setUnlocked(open);
    // El último elegido, salvo que fuera más alto de lo que hoy está abierto.
    setSelectedLevel(clampMemoryLevel(Math.min(stored.difficulty, open)));
  }, []);

  const config = MEMORY_LEVELS[level];
  const { speakAfterSound, cancel: cancelSpeaking } =
    useSpeakAfterSound(language);

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
  // si la espera de la pareja fallida siguiera corriendo, el niño volvería a
  // la partida y encontraría las fichas otra vez tapadas sin haberlas visto.
  const handleOverlayOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        timers.freeze();
        cancelSpeaking();
      } else {
        timers.resume();
      }
      pauseClock(open);
    },
    [timers, pauseClock, cancelSpeaking],
  );

  useEffect(() => {
    if (phase !== "playing" || paused) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [phase, paused]);

  const startGame = () => {
    timers.clear();
    cancelSpeaking();
    // El escalón es el elegido en el selector y se queda fijo hasta el final.
    const startingLevel = selectedLevel;
    const start = Date.now();
    setLevel(startingLevel);
    setSessionStars(0);
    setOpenedLevel(null);
    setLockedHint(null);
    setBoard(createMemoryBoard(MEMORY_LEVELS[startingLevel].pairs));
    setFlipped([]);
    setMatched([]);
    setWrongPair([]);
    setMoves(0);
    setLocked(false);
    setStartedAt(start);
    setNow(start);
    setFinalTime(0);
    setPhase("playing");
  };

  const handleFlip = (card: MemoryCard) => {
    if (locked || phase !== "playing") return;
    if (matched.includes(card.symbol.id) || flipped.includes(card.key)) return;

    playTapSound();
    const turned = [...flipped, card.key];
    setFlipped(turned);
    if (turned.length < 2) return;

    // Ya hay pareja sobre la mesa: cuenta como intento se acierte o no.
    const first = board.find((item) => item.key === turned[0]);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setLocked(true);

    if (first && first.symbol.id === card.symbol.id) {
      const nextMatched = [...matched, card.symbol.id];
      playCorrectSound();
      // La pareja también se dice en voz alta: el dibujo tiene nombre y esta
      // es la ocasión de oírlo en el idioma de la aplicación.
      speakAfterSound(card.symbol.label[language]);
      timers.later(() => {
        setMatched(nextMatched);
        setFlipped([]);
        if (nextMatched.length >= config.pairs) {
          finishGame(nextMoves, nextMatched.length);
          return;
        }
        setLocked(false);
      }, MEMORY_MATCH_MS);
      return;
    }

    playWrongSound();
    setWrongPair(turned);
    // Cuánto se queda a la vista una pareja fallida lo dice el escalón: es lo
    // que hace el quinto más difícil que el cuarto con el mismo tablero.
    timers.later(() => {
      setWrongPair([]);
      setFlipped([]);
      setLocked(false);
    }, config.flipBackMs);
  };

  /**
   * La partida llegó al final, así que hay valoración: la precisión decide
   * cuántas estrellas vale. Abandonar a mitad no pasa por aquí y por eso no
   * desbloquea nada ni guarda nada.
   */
  const finishGame = (finalMoves: number, pairsFound: number) => {
    const timeMs = Date.now() - startedAt;
    const finalAccuracy = memoryAccuracy(finalMoves, pairsFound);
    const rating = memorySessionStars(finalAccuracy, true);
    const nextUnlocked =
      rating >= 2 ? clampMemoryLevel(Math.max(unlocked, level + 1)) : unlocked;

    saveMemoryResult({
      playedLevel: level,
      sessionStars: rating,
      accuracy: finalAccuracy,
      timeMs,
      playedAt: new Date().toISOString(),
    });

    setFinalTime(timeMs);
    setSessionStars(rating);
    // Solo se anuncia lo que se acaba de abrir, no lo que ya estaba abierto.
    setOpenedLevel(nextUnlocked > unlocked ? nextUnlocked : null);
    setUnlocked(nextUnlocked);
    setPhase("results");
    playCelebrationSound();
  };

  /**
   * Volver a la introducción, donde está el selector, igual que en Trazos: si
   * se acaba de abrir un nivel, lo que se quiere es probarlo, y solo se puede
   * elegir ahí. Empezar sigue estando a un toque.
   */
  const backToIntro = () => {
    timers.clear();
    cancelSpeaking();
    setLockedHint(null);
    setPhase("intro");
  };

  const pickLevel = (option: MemoryLevel) => {
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

  const elapsed =
    phase === "playing" ? Math.max(0, now - startedAt) : finalTime;
  const accuracy = memoryAccuracy(moves, matched.length);

  return (
    <GameShell
      intro={{
        emoji: "🧠",
        title: t("memoryTitle"),
        goal: t("memoryIntro"),
        howTo: t("memoryHowTo"),
        example: <MemoryExample />,
      }}
      showIntro={phase === "intro"}
      startLabel={t("memoryStart")}
      onStart={startGame}
      confirmExit={phase === "playing"}
      onOverlayOpenChange={handleOverlayOpenChange}
      beforeStart={
        <LevelPicker
          maxLevel={MEMORY_MAX_LEVEL}
          unlocked={unlocked}
          selected={selectedLevel}
          lockedHint={lockedHint}
          onPick={(option) => pickLevel(clampMemoryLevel(option))}
        />
      }
    >
      {phase === "playing" && (
        <section className="memory-play mx-auto flex w-full max-w-xl flex-col items-center gap-2 pt-2 text-center sm:gap-3 sm:pt-4">
          <h1 className="text-base font-extrabold text-ink sm:text-2xl">
            {t("memoryInstruction")}
          </h1>
          <p className="-mt-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ink/45 sm:text-sm">
            {t("memoryLevelLabel", { level })}
          </p>

          <div className="grid w-full grid-cols-3 gap-1.5 sm:gap-3">
            <Metric
              icon="🧩"
              label={t("memoryPairs")}
              value={`${matched.length}/${config.pairs}`}
            />
            <Metric icon="👆" label={t("memoryMoves")} value={moves} />
            <Metric
              icon="⏱️"
              label={t("memoryTime")}
              value={formatMemoryTime(elapsed)}
            />
          </div>

          {/*
            Las columnas las dice el escalón —tres o cuatro, según cómo reparta
            el número de fichas—. El ancho lo calcula `.memory-board` contra el
            alto que queda libre, descontando el texto escalado y el área
            segura; `--memory-ratio` es columnas entre filas.
          */}
          <div
            className={`memory-board grid w-full gap-2 sm:gap-3 ${
              config.columns === 4 ? "grid-cols-4" : "grid-cols-3"
            }`}
            style={
              {
                "--memory-ratio": config.columns / ((config.pairs * 2) / config.columns),
              } as React.CSSProperties
            }
          >
            {board.map((card) => (
              <MemoryCardButton
                key={card.key}
                card={card}
                faceUp={
                  flipped.includes(card.key) || matched.includes(card.symbol.id)
                }
                solved={matched.includes(card.symbol.id)}
                wrong={wrongPair.includes(card.key)}
                locked={locked}
                hiddenLabel={t("memoryHiddenCard")}
                language={language}
                onFlip={() => handleFlip(card)}
              />
            ))}
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
              {t("memoryResultsTitle")}
            </h1>
            <p className="mt-2 text-xl font-semibold text-ink/65">
              {t("memoryResultsText", { total: config.pairs })}
            </p>
            <p className="mt-1 text-sm font-extrabold uppercase tracking-[0.18em] text-ink/45">
              {t("memoryLevelLabel", { level })}
            </p>
          </div>

          {/* Aparte de la precisión y el tiempo, que van en sus tarjetas. */}
          <SessionStars stars={sessionStars} openedLevel={openedLevel} />

          <div className="grid w-full grid-cols-3 gap-3">
            <ResultStat
              tone="sky"
              label={t("memoryTime")}
              value={formatMemoryTime(finalTime)}
            />
            <ResultStat tone="sky" label={t("memoryMoves")} value={moves} />
            <ResultStat
              tone="sky"
              label={t("memoryAccuracy")}
              value={`${accuracy}%`}
            />
          </div>
          <ResultActions
            playAgainLabel={t("memoryPlayAgain")}
            onPlayAgain={backToIntro}
          />
        </section>
      )}
    </GameShell>
  );
}

/**
 * Una ficha. Tapada es un botón de la marca —amarillo y con el borde grueso de
 * siempre— con un trozo de panal por reverso; destapada enseña su dibujo.
 *
 * El emoji dimensiona con `clamp`: su tamaño es parte de la ficha, que se mide
 * contra la ventana, así que no puede seguir la preferencia de texto.
 */
function MemoryCardButton({
  card,
  faceUp,
  solved,
  wrong,
  locked,
  hiddenLabel,
  language,
  onFlip,
}: {
  card: MemoryCard;
  faceUp: boolean;
  solved: boolean;
  wrong: boolean;
  locked: boolean;
  hiddenLabel: string;
  language: "en" | "es";
  onFlip: () => void;
}) {
  const face = solved
    ? "border-mint bg-mintsoft"
    : wrong
      ? "animate-shake border-coral bg-coralsoft"
      : faceUp
        ? "border-sky bg-white"
        : "border-[#e0a800] bg-sun border-b-8 active:border-b-2 active:scale-95";

  return (
    <button
      type="button"
      disabled={solved || (locked && !faceUp)}
      onClick={onFlip}
      aria-label={faceUp ? card.symbol.label[language] : hiddenLabel}
      className={`flex aspect-square w-full items-center justify-center rounded-2xl border-2 text-[clamp(1.75rem,9vw,3.25rem)] leading-none shadow-sm transition-colors disabled:cursor-default ${face}`}
    >
      {faceUp ? (
        <span aria-hidden="true">{card.symbol.emoji}</span>
      ) : (
        <CardBack />
      )}
    </button>
  );
}

/** El reverso: el mismo panal del resto de la aplicación, en pequeño. */
function CardBack() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-1/2 w-1/2 fill-ink/20"
      role="presentation"
      aria-hidden="true"
    >
      <polygon points={hexagonPoints(8.5, 8.5, 5)} />
      <polygon points={hexagonPoints(15.5, 12.5, 5)} />
      <polygon points={hexagonPoints(8.5, 16.5, 5)} />
    </svg>
  );
}

function Metric({
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
      <p className="mt-1 font-mono text-[0.72rem] font-extrabold tabular-nums text-ink sm:text-sm">
        {value}
      </p>
      <p className="mt-0.5 max-w-full overflow-hidden text-[0.45rem] font-extrabold uppercase leading-none tracking-[-0.04em] text-ink/50 sm:text-[0.6rem]">
        {label}
      </p>
    </div>
  );
}

/**
 * Ejemplo estático de la intro: una pareja encontrada y una ficha aún tapada.
 * No usa el generador real; solo enseña la mecánica antes de la primera
 * partida.
 */
function MemoryExample() {
  const { t } = useLanguage();

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={t("memoryExampleAria")}
    >
      <ExampleCard emoji="🍎" found />
      <ExampleCard emoji="🍎" found />
      <ExampleCard />
    </div>
  );
}

function ExampleCard({ emoji, found }: { emoji?: string; found?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-2xl ${
        found ? "border-mint bg-mintsoft" : "border-[#e0a800] bg-sun"
      }`}
    >
      {emoji ? <span>{emoji}</span> : <CardBack />}
    </span>
  );
}
