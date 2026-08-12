"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CategoryId, Question } from "@/data/questions";
import { getCategory, getCategoryBySlug } from "@/data/categories";
import { localizeQuestion } from "@/data/localization";
import {
  MAX_ATTEMPTS,
  ROUNDS_PER_SESSION,
  nextLevel,
  pickNextQuestion,
  shuffle,
} from "@/lib/gameEngine";
import { getLevelForCategory, saveSession } from "@/lib/storage";
import { cancelSpeech } from "@/lib/speech";
import {
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import BrandMark from "@/components/BrandMark";
import AudioButton from "@/components/AudioButton";
import MuteButton from "@/components/MuteButton";
import AnswerGrid from "@/components/AnswerGrid";
import type { OptionState } from "@/components/AnswerOption";
import ProgressDots from "@/components/ProgressDots";
import FeedbackOverlay, { type FeedbackType } from "@/components/FeedbackOverlay";
import ResultsScreen from "@/components/ResultsScreen";
import ExitDialog from "@/components/ExitDialog";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/i18n";

type Phase = "playing" | "results";

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

  const [phase, setPhase] = useState<Phase>("playing");
  const [question, setQuestion] = useState<Question | null>(null);
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [starsByRound, setStarsByRound] = useState<boolean[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [exitOpen, setExitOpen] = useState(false);

  const levelRef = useRef(1);
  const streakRef = useRef(0);
  const usedIdsRef = useRef<string[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

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
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    levelRef.current = getLevelForCategory(category.id);
    streakRef.current = 0;
    usedIdsRef.current = [];
    setRound(0);
    setStars(0);
    setStarsByRound([]);
    setPhase("playing");
    loadQuestion(category.id);
  }, [category, loadQuestion]);

  useEffect(() => {
    if (!category) {
      router.replace("/hexagons");
      return;
    }
    startSession();
    return () => {
      timersRef.current.forEach(clearTimeout);
      cancelSpeech();
    };
  }, [category, router, startSession]);

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
            <LanguageToggle className="game-header-control game-header-language" />
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
        <button
          type="button"
          onClick={() => setExitOpen(true)}
          aria-label={t("exitGameAria")}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink/20 bg-white text-2xl shadow-sm transition-transform active:scale-90"
        >
          🚪
        </button>
      </footer>

      <FeedbackOverlay type={feedback} hint={displayedQuestion.hint} />
      <ExitDialog open={exitOpen} onClose={() => setExitOpen(false)} />
    </main>
  );
}
