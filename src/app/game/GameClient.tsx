"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CategoryId, Question } from "@/data/questions";
import type { Category } from "@/data/categories";
import { getCategory, getCategoryBySlug } from "@/data/categories";
import { localizeHexagon, localizeQuestion } from "@/data/localization";
import {
  MAX_ATTEMPTS,
  ROUNDS_PER_SESSION,
  nextLevel,
  pickNextQuestion,
  shuffle,
} from "@/lib/gameEngine";
import { getLevelForCategory, saveSession } from "@/lib/storage";
import { useGameTimers } from "@/lib/gameTimers";
import { cancelSpeech } from "@/lib/speech";
import {
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import BrandMark from "@/components/BrandMark";
import AudioButton from "@/components/AudioButton";
import GameHelp from "@/components/GameHelp";
import GameShell from "@/components/GameShell";
import MuteButton from "@/components/MuteButton";
import AnswerGrid from "@/components/AnswerGrid";
import type { OptionState } from "@/components/AnswerOption";
import ProgressDots from "@/components/ProgressDots";
import FeedbackOverlay, { type FeedbackType } from "@/components/FeedbackOverlay";
import ResultsScreen from "@/components/ResultsScreen";
import ExitDialog from "@/components/ExitDialog";
import { useLanguage, type MessageKey } from "@/lib/i18n";

type Phase = "intro" | "playing" | "results";

export default function GameClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const legacyWorldParam = searchParams.get("world");
  const legacyCategoryParam = searchParams.get("categoria");
  const hexagonParam =
    searchParams.get("hexagon") ??
    legacyWorldParam ??
    legacyCategoryParam ??
    "";
  const category = getCategoryBySlug(hexagonParam) ?? getCategory(hexagonParam);

  const [phase, setPhase] = useState<Phase>("intro");
  const [question, setQuestion] = useState<Question | null>(null);
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [starsByRound, setStarsByRound] = useState<boolean[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [exitOpen, setExitOpen] = useState(false);

  // Espejo del nivel para poder mostrarlo. La dificultad la sigue mandando
  // `levelRef` y `nextLevel`; esto solo la hace visible.
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const streakRef = useRef(0);
  const usedIdsRef = useRef<string[]>([]);
  const timers = useGameTimers();
  const { later } = timers;

  // Con la ayuda abierta la sesión queda quieta: las esperas que pasan a la
  // siguiente pregunta se congelan, así que al cerrar sigue la misma pregunta.
  // No hay cronómetro que pausar: estas categorías no miden tiempo.
  const handleHelpOpenChange = useCallback(
    (open: boolean) => {
      if (open) timers.freeze();
      else timers.resume();
    },
    [timers],
  );

  useEffect(() => {
    if (!searchParams.get("hexagon") && category) {
      router.replace(`/game?hexagon=${category.slug}`);
    }
  }, [category, legacyCategoryParam, legacyWorldParam, router, searchParams]);

  const loadQuestion = useCallback((categoryId: CategoryId) => {
    const next = pickNextQuestion(
      categoryId,
      levelRef.current,
      usedIdsRef.current,
    );
    if (!next) return false;
    usedIdsRef.current.push(next.id);
    setQuestion({ ...next, options: shuffle(next.options) });
    setWrongIds([]);
    setFeedback(null);
    return true;
  }, []);

  const startSession = useCallback(() => {
    if (!category) return;
    timers.clear();
    levelRef.current = getLevelForCategory(category.id);
    setLevel(levelRef.current);
    streakRef.current = 0;
    usedIdsRef.current = [];
    setRound(0);
    setStars(0);
    setStarsByRound([]);
    setPhase("playing");
    loadQuestion(category.id);
  }, [category, loadQuestion, timers]);

  useEffect(() => {
    if (!category) router.replace("/hexagons");
  }, [category, router]);

  // Se entra por la explicación, no por la primera pregunta. La sesión —y con
  // ella el nivel guardado y el banco— arranca al pulsar Comenzar. Depende solo
  // de la categoría: nada más puede devolver una partida en curso a la intro.
  useEffect(() => {
    setPhase("intro");
  }, [category]);

  useEffect(
    () => () => {
      timers.clear();
      cancelSpeech();
    },
    [timers],
  );

  const finishSession = useCallback(
    (finalStars: number) => {
      if (!category) return;
      saveSession(
        {
          date: new Date().toISOString(),
          category: category.id,
          stars: finalStars,
          total: ROUNDS_PER_SESSION,
        },
        levelRef.current,
      );
      setPhase("results");
    },
    [category],
  );

  const advance = useCallback(
    (earnedStar: boolean, currentStars: number) => {
      if (!category) return;
      setStarsByRound((prev) => [...prev, earnedStar]);
      const nextRound = round + 1;
      if (nextRound >= ROUNDS_PER_SESSION || !loadQuestion(category.id)) {
        finishSession(currentStars);
        return;
      }
      setRound(nextRound);
    },
    [category, round, loadQuestion, finishSession],
  );

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!question || feedback === "correct" || feedback === "reveal") return;

      if (optionId === question.answerId) {
        const firstTry = wrongIds.length === 0;
        const newStars = stars + 1;
        setStars(newStars);
        setFeedback("correct");
        playCorrectSound();
        cancelSpeech();
        const result = firstTry
          ? nextLevel(levelRef.current, streakRef.current, false)
          : { level: levelRef.current, streak: 0 };
        levelRef.current = result.level;
        setLevel(result.level);
        streakRef.current = result.streak;
        later(() => advance(true, newStars), 1400);
        return;
      }

      // Respuesta incorrecta
      playWrongSound();
      const newWrongIds = [...wrongIds, optionId];
      setWrongIds(newWrongIds);

      if (newWrongIds.length >= MAX_ATTEMPTS) {
        // Se acabaron los intentos: mostrar la correcta con cariño
        setFeedback("reveal");
        const result = nextLevel(levelRef.current, streakRef.current, true);
        levelRef.current = result.level;
        setLevel(result.level);
        streakRef.current = result.streak;
        later(() => advance(false, stars), 2200);
      } else {
        setFeedback("almost");
        later(() => {
          setFeedback((current) => (current === "almost" ? null : current));
        }, 3000);
      }
    },
    [question, feedback, wrongIds, stars, later, advance],
  );

  if (!category) return null;

  const intro = {
    emoji: category.emoji,
    title: localizeHexagon(category, language).name,
    goal: t(CATEGORY_INTRO[category.slug].goal),
    howTo: t(CATEGORY_INTRO[category.slug].howTo),
    example: CATEGORY_INTRO[category.slug].example,
  };

  if (phase === "intro") {
    // La explicación previa reutiliza el mismo marco que los juegos
    // independientes. Aquí la casa no pregunta nada: todavía no hay sesión que
    // abandonar, así que volver a Explore no deja ninguna a medias.
    return (
      <GameShell
        intro={intro}
        showIntro
        startLabel={t("categoryStart")}
        onStart={startSession}
      >
        {null}
      </GameShell>
    );
  }

  if (phase === "results") {
    return (
      <ResultsScreen
        stars={stars}
        total={ROUNDS_PER_SESSION}
        onPlayAgain={startSession}
      />
    );
  }

  if (!question) return null;

  const displayedQuestion = localizeQuestion(question, language);

  const getState = (optionId: string): OptionState => {
    if (
      (feedback === "correct" || feedback === "reveal") &&
      optionId === question.answerId
    ) {
      return feedback === "correct" ? "correct" : "revealed";
    }
    if (wrongIds.includes(optionId)) return "wrong";
    if (feedback === "correct" || feedback === "reveal") return "locked";
    return "idle";
  };

  return (
    <main className="flex min-h-dvh flex-col bg-cream">
      {/* Encabezado */}
      <header className="game-header relative isolate overflow-hidden border-b border-ink/5 bg-cream px-3 py-2 shadow-[0_4px_16px_rgba(74,56,0,0.045)] sm:px-8 sm:py-3.5">
        <div className="game-header-hive game-header-hive-left" aria-hidden="true">
          <span className="game-header-hex game-header-hex-one" />
          <span className="game-header-hex game-header-hex-two" />
          <span className="game-header-hex game-header-hex-three" />
        </div>
        <div className="game-header-hive game-header-hive-right" aria-hidden="true">
          <span className="game-header-hex game-header-hex-one" />
          <span className="game-header-hex game-header-hex-two" />
          <span className="game-header-hex game-header-hex-three" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            <BrandMark
              size={52}
              priority
              className="h-11 w-11 shadow-[0_4px_12px_rgba(255,196,0,0.2)] sm:h-[52px] sm:w-[52px]"
            />
            <span className="hidden truncate text-base font-extrabold text-ink min-[380px]:block sm:text-xl">
              BIntuitive
            </span>
          </div>

          <div
            className="rounded-full border border-[#e0a800]/45 bg-sun px-3 py-1.5 text-sm font-extrabold tabular-nums text-ink shadow-[0_3px_9px_rgba(166,121,0,0.13)] sm:px-5 sm:text-lg"
            aria-label={t("starsProgressAria", {
              stars,
              total: ROUNDS_PER_SESSION,
            })}
          >
            ⭐ {stars}/{ROUNDS_PER_SESSION}
          </div>

          <div className="flex items-center justify-self-end gap-1.5 sm:gap-2">
            <GameHelp
              intro={intro}
              buttonClassName="game-header-control game-header-sound"
              onOpenChange={handleHelpOpenChange}
            />
            <MuteButton className="game-header-control game-header-sound" />
          </div>
        </div>
      </header>

      {/* Instrucción */}
      <section className="flex items-center justify-center gap-4 px-4 py-2 sm:px-8">
        <h1 className="max-w-xl text-center text-2xl font-extrabold leading-snug text-ink sm:text-4xl">
          {displayedQuestion.instruction}
        </h1>
        <AudioButton
          key={`${question.id}-${language}`}
          text={displayedQuestion.instruction}
          autoPlay
        />
      </section>

      {/* Opciones */}
      <section
        className="flex flex-1 items-center justify-center px-4 py-4 sm:px-8"
        onPointerDown={() => playTapSound()}
      >
        <AnswerGrid
          options={displayedQuestion.options}
          getState={getState}
          onSelect={handleSelect}
        />
      </section>

      {/* Pie: progreso y salir */}
      <footer className="flex items-center justify-between px-4 py-4 sm:px-8">
        <ProgressDots
          total={ROUNDS_PER_SESSION}
          current={round}
          starsByRound={starsByRound}
        />
        {/*
          Misma casa que los demás juegos: siempre devuelve a Explore. Aquí va
          antes el diálogo de confirmación, porque la lección está en curso y
          salir por descuido perdería las estrellas de la sesión.
        */}
        <button
          type="button"
          onClick={() => setExitOpen(true)}
          aria-label={t("exitGameAria")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink/20 bg-white text-2xl shadow-sm transition-transform active:scale-90"
        >
          <span aria-hidden="true">🏠</span>
        </button>
      </footer>

      <FeedbackOverlay type={feedback} hint={displayedQuestion.hint} />
      <ExitDialog open={exitOpen} onClose={() => setExitOpen(false)} />
    </main>
  );
}

/**
 * Qué explica cada categoría. Es una tabla de datos por `slug`: ni `GameShell`
 * ni `GameIntro` ni `GameHelp` saben que existen Lugares, Números o Colores.
 * Los ejemplos son estáticos y no salen del banco de preguntas; solo enseñan
 * la mecánica que el banco ya usa.
 */
const CATEGORY_INTRO = {
  places: {
    goal: "placesGoal",
    howTo: "placesHowTo",
    example: <PlacesExample />,
  },
  numbers: {
    goal: "numbersGoal",
    howTo: "numbersHowTo",
    example: <NumbersExample />,
  },
  colors: {
    goal: "colorsGoal",
    howTo: "colorsHowTo",
    example: <ColorsExample />,
  },
} as const satisfies Record<
  Category["slug"],
  { goal: MessageKey; howTo: MessageKey; example: ReactNode }
>;

function PlacesExample() {
  const { t } = useLanguage();

  return (
    <ExampleRow ariaLabel={t("placesExampleAria")} answer={t("placesExampleWord")}>
      <span className="text-3xl">🏖️</span>
    </ExampleRow>
  );
}

function NumbersExample() {
  const { t } = useLanguage();

  return (
    <ExampleRow ariaLabel={t("numbersExampleAria")} answer="3">
      <span className="text-2xl tracking-tight">🍎🍎🍎</span>
    </ExampleRow>
  );
}

function ColorsExample() {
  const { t } = useLanguage();

  return (
    <ExampleRow ariaLabel={t("colorsExampleAria")} answer={t("colorsExampleWord")}>
      {/* Un cuadro de color real se lee mejor que un emoji de color. */}
      <span className="h-8 w-8 rounded-lg border-2 border-ink/15 bg-sky" />
    </ExampleRow>
  );
}

/** Pista a la izquierda, flecha y respuesta correcta a la derecha. */
function ExampleRow({
  ariaLabel,
  answer,
  children,
}: {
  ariaLabel: string;
  answer: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3"
      role="img"
      aria-label={ariaLabel}
    >
      <span
        className="flex h-12 min-w-12 items-center justify-center rounded-2xl border-2 border-ink/10 bg-cream px-2"
        aria-hidden="true"
      >
        {children}
      </span>
      <span aria-hidden="true" className="text-xl font-extrabold text-ink/35">
        →
      </span>
      <span
        className="flex h-12 items-center rounded-2xl border-2 border-mint bg-mintsoft px-4 text-lg font-extrabold text-ink"
        aria-hidden="true"
      >
        {answer}
      </span>
    </div>
  );
}
