"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AudioButton from "@/components/AudioButton";
import BrandMark from "@/components/BrandMark";
import GameIntro from "@/components/GameIntro";
import GameShell from "@/components/GameShell";
import { useLanguage } from "@/lib/i18n";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
} from "@/lib/sounds";
import { getWordScrambleProgress, saveWordScrambleProgress } from "@/lib/storage";
import {
  computeWordScrambleStats,
  createLetterTiles,
  getWordLetters,
  nextWordScrambleLevel,
  pickNextWord,
  WORD_SCRAMBLE_MAX_LEVEL,
  WORD_SCRAMBLE_WORDS_PER_SESSION,
  type LetterTile,
  type ScrambleWord,
  type WordScrambleStats,
} from "@/lib/wordScramble";

type Phase = "intro" | "playing" | "results";

const SOLVED_PAUSE_MS = 1100;
const WRONG_FLASH_MS = 350;

export default function WordScrambleGame() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");
  const [word, setWord] = useState<ScrambleWord | null>(null);
  const [tiles, setTiles] = useState<LetterTile[]>([]);
  const [placed, setPlaced] = useState<LetterTile[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [level, setLevel] = useState(1);
  const [wrongTileId, setWrongTileId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<WordScrambleStats | null>(null);
  const [isRecord, setIsRecord] = useState(false);

  const levelRef = useRef(1);
  const streakRef = useRef(0);
  const usedIdsRef = useRef<string[]>([]);
  const wordMistakesRef = useRef(0);
  const mistakesRef = useRef(0);
  const correctTapsRef = useRef(0);
  const perfectWordsRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sessionLanguageRef = useRef(language);

  // Espejo en refs de las letras colocadas y de los bloqueos. Dos toques en el
  // mismo tick (multitouch en iPad, toques muy rápidos) leerían el mismo estado
  // de React y se pisarían entre sí; las refs se actualizan al instante.
  const placedRef = useRef<LetterTile[]>([]);
  const solvedRef = useRef(false);
  const lockedRef = useRef(false);

  const applyPlaced = useCallback((next: LetterTile[]) => {
    placedRef.current = next;
    setPlaced(next);
  }, []);

  const applyLocked = useCallback((next: boolean) => {
    lockedRef.current = next;
    setLocked(next);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const loadWord = useCallback(() => {
    const next = pickNextWord(language, levelRef.current, usedIdsRef.current);
    if (!next) return false;
    usedIdsRef.current.push(next.id);
    wordMistakesRef.current = 0;
    solvedRef.current = false;
    setWord(next);
    setTiles(createLetterTiles(next.word));
    applyPlaced([]);
    setWrongTileId(null);
    setSolved(false);
    applyLocked(false);
    return true;
  }, [applyLocked, applyPlaced, language]);

  const startGame = useCallback(() => {
    clearTimers();
    levelRef.current = getWordScrambleProgress().level;
    streakRef.current = 0;
    usedIdsRef.current = [];
    mistakesRef.current = 0;
    correctTapsRef.current = 0;
    perfectWordsRef.current = 0;
    setLevel(levelRef.current);
    setWordIndex(0);
    setResult(null);
    setIsRecord(false);
    loadWord();
    setPhase("playing");
  }, [clearTimers, loadWord]);

  // El banco de palabras depende del idioma: si cambia, la sesión vuelve al inicio.
  useEffect(() => {
    if (sessionLanguageRef.current === language) return;
    sessionLanguageRef.current = language;
    clearTimers();
    setPhase("intro");
  }, [clearTimers, language]);

  const finishGame = useCallback((solvedWords: number) => {
    const stats = computeWordScrambleStats(
      solvedWords,
      perfectWordsRef.current,
      correctTapsRef.current,
      mistakesRef.current,
    );
    const previousBest = getWordScrambleProgress().bestPerfectWords;
    saveWordScrambleProgress({
      level: levelRef.current,
      bestPerfectWords: stats.perfectWords,
    });
    setResult(stats);
    setIsRecord(stats.perfectWords > 0 && stats.perfectWords > previousBest);
    setPhase("results");
    playCelebrationSound();
  }, []);

  const completeWord = useCallback(() => {
    // Blindaje: la palabra solo puede completarse una vez, aunque dos toques
    // simultáneos alcancen la última letra en el mismo tick.
    if (solvedRef.current) return;
    solvedRef.current = true;

    const wordMistakes = wordMistakesRef.current;
    if (wordMistakes === 0) perfectWordsRef.current += 1;

    const progression = nextWordScrambleLevel(
      levelRef.current,
      streakRef.current,
      wordMistakes,
    );
    levelRef.current = progression.level;
    streakRef.current = progression.streak;

    setSolved(true);
    applyLocked(true);
    playCorrectSound();

    later(() => {
      const nextIndex = wordIndex + 1;
      setWordIndex(nextIndex);
      setLevel(levelRef.current);
      if (nextIndex >= WORD_SCRAMBLE_WORDS_PER_SESSION || !loadWord()) {
        finishGame(nextIndex);
      }
    }, SOLVED_PAUSE_MS);
  }, [applyLocked, finishGame, later, loadWord, wordIndex]);

  // Letras reales de la palabra: `Ñ`, `Ü` y las vocales con tilde cuentan como una.
  const letters = word ? getWordLetters(word.word) : [];

  const handleTapLetter = (tile: LetterTile) => {
    if (!word || phase !== "playing" || lockedRef.current || solvedRef.current) {
      return;
    }
    const current = placedRef.current;
    if (current.some((item) => item.id === tile.id)) return;

    const expected = letters[current.length];
    if (tile.letter !== expected) {
      mistakesRef.current += 1;
      wordMistakesRef.current += 1;
      setWrongTileId(tile.id);
      applyLocked(true);
      playWrongSound();
      later(() => {
        setWrongTileId(null);
        applyLocked(false);
      }, WRONG_FLASH_MS);
      return;
    }

    correctTapsRef.current += 1;
    const nextPlaced = [...current, tile];
    applyPlaced(nextPlaced);
    playTapSound();
    if (nextPlaced.length === letters.length) completeWord();
  };

  const handleUndo = () => {
    const current = placedRef.current;
    if (lockedRef.current || solvedRef.current || current.length === 0) return;
    applyPlaced(current.slice(0, -1));
    playTapSound();
  };

  const handleClear = () => {
    if (lockedRef.current || solvedRef.current || placedRef.current.length === 0) {
      return;
    }
    applyPlaced([]);
    playTapSound();
  };

  const placedIds = new Set(placed.map((tile) => tile.id));
  const answerText = placed.map((tile) => tile.letter).join("");

  return (
    <GameShell>
      {phase === "intro" && (
        <GameIntro
          emoji="🧩"
          title={t("scrambleTitle")}
          goal={t("scrambleIntro")}
          howTo={t("scrambleHowTo")}
          startLabel={t("scrambleStart")}
          onStart={startGame}
        />
      )}

      {phase === "playing" && word && (
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 pb-4 pt-3 sm:gap-6 sm:pt-6">
          <div className="flex w-full items-center justify-between gap-3">
            <span
              className="rounded-full border-2 border-ink/10 bg-white px-4 py-1.5 font-mono text-base font-extrabold tabular-nums text-ink/70 shadow-sm sm:text-lg"
              role="status"
              aria-label={t("scrambleProgressAria", {
                current: Math.min(wordIndex + 1, WORD_SCRAMBLE_WORDS_PER_SESSION),
                total: WORD_SCRAMBLE_WORDS_PER_SESSION,
              })}
            >
              {Math.min(wordIndex + 1, WORD_SCRAMBLE_WORDS_PER_SESSION)} / {WORD_SCRAMBLE_WORDS_PER_SESSION}
            </span>
            <span
              className="flex items-center gap-2 rounded-full border-2 border-mint bg-mintsoft px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-ink/70 shadow-sm sm:text-base"
              aria-label={t("scrambleLevelAria", {
                level,
                total: WORD_SCRAMBLE_MAX_LEVEL,
              })}
            >
              <span>{t("scrambleLevel")}</span>
              <span aria-hidden="true" className="flex gap-1">
                {Array.from({ length: WORD_SCRAMBLE_MAX_LEVEL }, (_, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      index < level ? "bg-ink/70" : "bg-ink/15"
                    }`}
                  />
                ))}
              </span>
            </span>
          </div>

          <div className="flex w-full items-center gap-4 rounded-3xl border-2 border-mint bg-white px-4 py-4 shadow-[0_10px_28px_rgba(74,56,0,0.08)] sm:gap-5 sm:px-6 sm:py-5">
            <span
              className="text-[clamp(3rem,13vw,4.5rem)] leading-none"
              aria-hidden="true"
            >
              {word.emoji}
            </span>
            <p className="min-w-0 flex-1 text-left text-base font-bold leading-snug text-ink/70 sm:text-xl">
              {word.clue}
            </p>
            <AudioButton text={word.word} label={t("scrambleListen")} />
          </div>

          <div className="w-full text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#9b7400] sm:text-base">
              {t("scrambleInstruction")}
            </p>

            <div
              className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-3"
              role="status"
              aria-live="polite"
              aria-label={t("scrambleAnswerAria", {
                word: answerText || t("scrambleEmptyAnswer"),
              })}
            >
              {letters.map((_, index) => {
                const tile = placed[index];
                const isNext = index === placed.length && !solved;
                const stateClass = solved
                  ? "animate-pop border-[#e0a800] bg-sun text-black"
                  : tile
                    ? "border-mint bg-mintsoft text-ink"
                    : isNext
                      ? "border-mint bg-white text-ink"
                      : "border-dashed border-ink/20 bg-white text-ink";

                return (
                  <span
                    key={index}
                    aria-hidden="true"
                    className={`flex h-[clamp(3rem,11vw,4.5rem)] w-[clamp(2.6rem,9vw,4rem)] items-center justify-center rounded-2xl border-[3px] text-[clamp(1.5rem,5.5vw,2.5rem)] font-extrabold uppercase leading-none shadow-sm transition-colors duration-200 ${stateClass}`}
                  >
                    {tile?.letter ?? ""}
                  </span>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleUndo}
                disabled={placed.length === 0 || solved}
                aria-label={t("scrambleUndo")}
                className="flex h-12 min-w-14 items-center justify-center rounded-2xl border-2 border-ink/15 bg-white text-xl font-extrabold text-ink shadow-sm transition-transform active:scale-90 disabled:opacity-30"
              >
                <span aria-hidden="true">⌫</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={placed.length === 0 || solved}
                aria-label={t("scrambleClear")}
                className="flex h-12 min-w-14 items-center justify-center rounded-2xl border-2 border-ink/15 bg-white text-xl font-extrabold text-ink shadow-sm transition-transform active:scale-90 disabled:opacity-30"
              >
                <span aria-hidden="true">↺</span>
              </button>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
            aria-label={t("scrambleLettersAria")}
          >
            {tiles.map((tile) => {
              const used = placedIds.has(tile.id);
              const isWrong = wrongTileId === tile.id;
              const stateClass = isWrong
                ? "animate-shake border-coral bg-coralsoft"
                : "border-ink/15 bg-white";

              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleTapLetter(tile)}
                  disabled={used || locked}
                  aria-label={t("scrambleLetterAria", { letter: tile.letter })}
                  className={`flex h-[clamp(3.5rem,13vw,5rem)] w-[clamp(3.2rem,12vw,4.75rem)] items-center justify-center rounded-2xl border-[3px] text-[clamp(1.75rem,6.5vw,2.75rem)] font-extrabold uppercase leading-none text-ink shadow-[0_6px_0_rgba(74,56,0,0.08)] transition-transform duration-150 active:scale-90 disabled:opacity-25 disabled:shadow-none ${stateClass}`}
                >
                  <span aria-hidden="true">{tile.letter}</span>
                </button>
              );
            })}
          </div>

          <p
            className={`min-h-8 text-2xl font-extrabold text-[#27885a] transition-opacity duration-200 ${
              solved ? "animate-fade-up opacity-100" : "opacity-0"
            }`}
            role="status"
            aria-live="polite"
          >
            {solved ? t("feedbackCorrect") : ""}
          </p>
        </section>
      )}

      {phase === "results" && result && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <BrandMark
            size={140}
            className="shadow-[0_14px_40px_rgba(255,196,0,0.2)]"
          />
          <div>
            <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">
              {t("scrambleResultsTitle")}
            </h1>
            <p className="mt-2 text-lg font-semibold text-ink/60">
              {t("scrambleResultsText", { total: result.solvedWords })}
            </p>
            {isRecord && (
              <p className="mt-3 inline-block rounded-full border-2 border-sun bg-sunsoft px-5 py-1.5 text-base font-extrabold text-ink">
                {t("scrambleRecord")}
              </p>
            )}
          </div>
          <div className="grid w-full grid-cols-3 gap-3">
            <ResultStat
              label={t("scramblePerfectWords")}
              value={`${result.perfectWords}/${result.solvedWords}`}
            />
            <ResultStat
              label={t("scrambleAccuracy")}
              value={`${Math.round(result.accuracy * 100)}%`}
            />
            <ResultStat label={t("scrambleMistakes")} value={result.mistakes} />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startGame}
              className="min-h-14 flex-1 rounded-2xl border-b-8 border-[#9b7600] bg-sun px-6 py-3 text-xl font-extrabold text-black shadow-lg active:scale-95 active:border-b-4"
            >
              {t("scramblePlayAgain")}
            </button>
            <Link
              href="/hexagons"
              className="flex min-h-14 flex-1 items-center justify-center rounded-2xl border-b-8 border-black/30 bg-black px-6 py-3 text-xl font-extrabold text-white shadow-lg active:scale-95 active:border-b-4"
            >
              {t("backToHexagons")}
            </Link>
          </div>
        </section>
      )}
    </GameShell>
  );
}

function ResultStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border-2 border-mint bg-white px-2 py-4 shadow-sm">
      <p className="text-2xl font-extrabold text-ink sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink/50 sm:text-sm">
        {label}
      </p>
    </div>
  );
}
