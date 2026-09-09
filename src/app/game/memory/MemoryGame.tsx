"use client";

import { useCallback, useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";
import GameShell from "@/components/GameShell";
import ResultActions from "@/components/ResultActions";
import ResultStat from "@/components/ResultStat";
import { useClockPause } from "@/lib/clockPause";
import { useGameTimers } from "@/lib/gameTimers";
import { hexagonPoints } from "@/lib/hexagon";
import { useLanguage } from "@/lib/i18n";
import {
  createMemoryBoard,
  formatMemoryTime,
  memoryAccuracy,
  MEMORY_FLIP_BACK_MS,
  MEMORY_MATCH_MS,
  MEMORY_PAIRS,
  type MemoryCard,
} from "@/lib/memoryGame";
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
  const timers = useGameTimers();
  const { speakAfterSound, cancel: cancelSpeaking } =
    useSpeakAfterSound(language);

  // Leer la ayuda no puede costar tiempo: el cronómetro se detiene mientras
  // está abierta y el instante de inicio se desplaza al reanudar.
  const [paused, pauseClock] = useClockPause(
    useCallback((pausedMs: number) => {
      setStartedAt((current) => current + pausedMs);
      setNow(Date.now());
    }, []),
  );

  // Con la ayuda abierta la partida queda quieta: si la espera de la pareja
  // fallida siguiera corriendo, el niño cerraría la ayuda y se encontraría las
  // fichas otra vez tapadas sin haberlas visto.
  const handleHelpOpenChange = useCallback(
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
    const start = Date.now();
    setBoard(createMemoryBoard());
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
        if (nextMatched.length >= MEMORY_PAIRS) {
          setFinalTime(Date.now() - startedAt);
          setPhase("results");
          playCelebrationSound();
          return;
        }
        setLocked(false);
      }, MEMORY_MATCH_MS);
      return;
    }

    playWrongSound();
    setWrongPair(turned);
    timers.later(() => {
      setWrongPair([]);
      setFlipped([]);
      setLocked(false);
    }, MEMORY_FLIP_BACK_MS);
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
      onHelpOpenChange={handleHelpOpenChange}
    >
      {phase === "playing" && (
        <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 pt-2 text-center sm:gap-3 sm:pt-4">
          <h1 className="text-base font-extrabold text-ink sm:text-2xl">
            {t("memoryInstruction")}
          </h1>

          <div className="grid w-full grid-cols-3 gap-1.5 sm:gap-3">
            <Metric
              icon="🧩"
              label={t("memoryPairs")}
              value={`${matched.length}/${MEMORY_PAIRS}`}
            />
            <Metric icon="👆" label={t("memoryMoves")} value={moves} />
            <Metric
              icon="⏱️"
              label={t("memoryTime")}
              value={formatMemoryTime(elapsed)}
            />
          </div>

          {/*
            Tres columnas, siempre: el tablero es vertical porque se juega con
            el teléfono en la mano. El ancho lo manda la altura de la ventana
            —medida en `svh`, el viewport que no cambia al plegarse las barras—
            para que las cuatro filas quepan sin desplazar la página.
          */}
          <div className="grid w-full max-w-[min(22rem,calc((100svh-13rem)*0.75))] grid-cols-3 gap-2 sm:max-w-[min(26rem,calc((100svh-14rem)*0.75))] sm:gap-3">
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
              {t("memoryResultsText", { total: MEMORY_PAIRS })}
            </p>
          </div>
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
            onPlayAgain={startGame}
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
