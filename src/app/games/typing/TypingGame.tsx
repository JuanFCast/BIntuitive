"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import LanguageToggle from "@/components/LanguageToggle";
import MuteButton from "@/components/MuteButton";
import { useLanguage } from "@/lib/i18n";
import { playCelebrationSound } from "@/lib/sounds";
import {
  buildTypingPassage,
  computeTypingStats,
  TYPING_DURATION_SECONDS,
  type TypingStats,
} from "@/lib/typingGame";

type Phase = "intro" | "ready" | "playing" | "results";

export default function TypingGame() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("intro");
  const [passage, setPassage] = useState("");
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState(0);
  const [mistakeIndices, setMistakeIndices] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<TypingStats | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passageContainerRef = useRef<HTMLDivElement>(null);
  const activeCharacterRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<Phase>(phase);
  const passageRef = useRef("");
  const typedRef = useRef("");
  const startedAtRef = useRef(0);
  const mistakesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase === "ready") inputRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (phase !== "ready" && phase !== "playing") return;

    const container = passageContainerRef.current;
    const activeCharacter = activeCharacterRef.current;
    if (!container || !activeCharacter) return;

    const padding = 16;
    const containerRect = container.getBoundingClientRect();
    const characterRect = activeCharacter.getBoundingClientRect();
    const characterTop =
      characterRect.top - containerRect.top + container.scrollTop;
    const characterBottom = characterTop + characterRect.height;
    const visibleTop = container.scrollTop + padding;
    const visibleBottom =
      container.scrollTop + container.clientHeight - padding;

    if (characterTop < visibleTop || characterBottom > visibleBottom) {
      container.scrollTo({
        top: Math.max(0, characterTop - container.clientHeight / 2),
        behavior: "smooth",
      });
    }
  }, [phase, typed.length]);

  const finishRound = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const elapsed = Math.min(
      Date.now() - startedAtRef.current,
      TYPING_DURATION_SECONDS * 1000,
    );
    const finalStats = computeTypingStats(
      typedRef.current,
      passageRef.current,
      elapsed,
      mistakesRef.current.size,
    );
    phaseRef.current = "results";
    setFinalElapsed(elapsed);
    setResult(finalStats);
    setPhase("results");
    playCelebrationSound();
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (
        current - startedAtRef.current >=
        TYPING_DURATION_SECONDS * 1000
      ) {
        finishRound();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [phase, finishRound]);

  const prepareRound = () => {
    const nextPassage = buildTypingPassage(language);
    passageRef.current = nextPassage;
    typedRef.current = "";
    mistakesRef.current = new Set();
    startedAtRef.current = 0;
    phaseRef.current = "ready";
    setPassage(nextPassage);
    setTyped("");
    setMistakeIndices(new Set());
    setStartedAt(0);
    setNow(0);
    setFinalElapsed(0);
    setResult(null);
    setPhase("ready");
  };

  const handleInput = (value: string) => {
    if (phaseRef.current === "results" || phaseRef.current === "intro") return;
    const clipped = value.slice(0, passageRef.current.length);
    let nextMistakes = mistakesRef.current;

    for (let index = 0; index < clipped.length; index += 1) {
      if (
        clipped[index] !== passageRef.current[index] &&
        !nextMistakes.has(index)
      ) {
        if (nextMistakes === mistakesRef.current) {
          nextMistakes = new Set(nextMistakes);
        }
        nextMistakes.add(index);
      }
    }

    if (phaseRef.current === "ready" && clipped.length > 0) {
      const start = Date.now();
      startedAtRef.current = start;
      phaseRef.current = "playing";
      setStartedAt(start);
      setNow(start);
      setPhase("playing");
    }

    typedRef.current = clipped;
    mistakesRef.current = nextMistakes;
    setTyped(clipped);
    setMistakeIndices(nextMistakes);

    if (clipped.length >= passageRef.current.length) {
      finishRound();
    }
  };

  const keepInputCursorAtEnd = () => {
    const input = inputRef.current;
    if (!input) return;
    const end = input.value.length;
    input.setSelectionRange(end, end);
  };

  const focusTypingInput = () => {
    inputRef.current?.focus({ preventScroll: true });
    keepInputCursorAtEnd();
  };

  const elapsed =
    phase === "playing" ? Math.max(0, now - startedAt) : finalElapsed;
  const remaining =
    phase === "ready"
      ? TYPING_DURATION_SECONDS
      : Math.max(
          0,
          Math.ceil(
            (TYPING_DURATION_SECONDS * 1000 - elapsed) / 1000,
          ),
        );
  const liveStats = useMemo(
    () =>
      computeTypingStats(
        typed,
        passage,
        phase === "playing" ? elapsed : finalElapsed,
        mistakeIndices.size,
      ),
    [typed, passage, phase, elapsed, finalElapsed, mistakeIndices],
  );

  return (
    <main className="min-h-dvh overflow-y-auto bg-cream px-3 py-3 sm:px-6 sm:py-5">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link
          href="/hexagons"
          className="flex min-h-12 items-center rounded-full border-2 border-ink/15 bg-white px-4 text-base font-extrabold text-ink shadow-sm active:scale-95"
        >
          ← <span className="hidden sm:inline">{t("backToHexagons")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <MuteButton />
        </div>
      </header>

      {phase === "intro" && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <BrandMark
            size={130}
            className="shadow-[0_14px_40px_rgba(255,196,0,0.2)]"
          />
          <div>
            <p className="text-5xl" aria-hidden="true">⌨️</p>
            <h1 className="mt-2 text-4xl font-extrabold text-ink sm:text-5xl">
              {t("typingTitle")}
            </h1>
            <p className="mt-3 text-xl font-bold text-ink/70">
              {t("typingIntro")}
            </p>
            <p className="mx-auto mt-2 max-w-lg text-base font-semibold text-ink/55 sm:text-lg">
              {t("typingHowTo")}
            </p>
          </div>
          <button
            type="button"
            onClick={prepareRound}
            className="min-h-16 rounded-2xl border-b-8 border-[#9b7600] bg-sun px-10 py-3 text-2xl font-extrabold text-black shadow-xl transition-transform active:scale-95 active:border-b-4"
          >
            {t("typingStart")}
          </button>
        </section>
      )}

      {(phase === "ready" || phase === "playing") && (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-2 pb-3 pt-2 sm:gap-4 sm:pb-5 sm:pt-5">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm sm:items-end sm:gap-4 sm:px-4 sm:py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/55 sm:text-sm">
                {t("typingTime")}
              </p>
              <p
                className={`font-mono text-2xl font-extrabold tabular-nums sm:text-3xl ${
                  remaining <= 10 ? "text-coral" : "text-ink"
                }`}
              >
                {remaining}s
              </p>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-2 sm:max-w-lg">
              <CompactStat label={t("typingWpm")} value={liveStats.wpm} />
              <CompactStat
                label={t("typingAccuracy")}
                value={`${Math.round(liveStats.accuracy * 100)}%`}
              />
              <CompactStat
                label={t("typingMistakes")}
                value={liveStats.mistakes}
              />
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full bg-berry transition-[width] duration-100"
              style={{ width: `${liveStats.progress * 100}%` }}
            />
          </div>

          <div
            onClick={focusTypingInput}
            className="relative cursor-text overflow-hidden rounded-2xl border-[3px] border-berry bg-white shadow-xl focus-within:ring-4 focus-within:ring-berry/25 sm:rounded-3xl sm:border-4"
          >
            <div
              ref={passageContainerRef}
              className="max-h-[min(34dvh,15rem)] overflow-y-auto scroll-smooth p-3 sm:max-h-[48dvh] sm:p-6"
            >
              <p
                id="typing-passage"
                translate="no"
                className="notranslate pointer-events-none whitespace-pre-wrap break-words font-mono text-base font-semibold leading-6 sm:text-2xl sm:leading-10"
              >
                {[...passage].map((character, index) => {
                  let className = "text-ink/75";
                  if (index < typed.length) {
                    className =
                      typed[index] === character
                        ? mistakeIndices.has(index)
                          ? "bg-sunsoft text-ink"
                          : "text-[#27885a]"
                        : "rounded bg-coralsoft text-[#c9433b] underline decoration-2";
                  } else if (index === typed.length) {
                    className = "rounded bg-sunsoft text-ink animate-pulse";
                  }
                  return (
                    <span
                      key={index}
                      ref={index === typed.length ? activeCharacterRef : undefined}
                      className={className}
                    >
                      {character}
                    </span>
                  );
                })}
              </p>
            </div>
            <label className="sr-only" htmlFor="typing-input">
              {t("typingInputLabel")}
            </label>
            <textarea
              id="typing-input"
              ref={inputRef}
              aria-describedby="typing-passage"
              value={typed}
              onChange={(event) => handleInput(event.target.value)}
              onClick={keepInputCursorAtEnd}
              onFocus={keepInputCursorAtEnd}
              onPaste={(event) => event.preventDefault()}
              rows={1}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="done"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full resize-none overflow-hidden rounded-[inherit] bg-transparent opacity-0 outline-none"
            />
          </div>
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
              {t("typingResultsTitle")}
            </h1>
            <p className="mt-2 text-lg font-semibold text-ink/60">
              {t("typingResultsText")}
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-3">
            <ResultStat label={t("typingWpm")} value={result.wpm} />
            <ResultStat
              label={t("typingAccuracy")}
              value={`${Math.round(result.accuracy * 100)}%`}
            />
            <ResultStat label={t("typingMistakes")} value={result.mistakes} />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={prepareRound}
              className="min-h-14 flex-1 rounded-2xl border-b-8 border-[#9b7600] bg-sun px-6 py-3 text-xl font-extrabold text-black shadow-lg active:scale-95 active:border-b-4"
            >
              {t("typingPlayAgain")}
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
    </main>
  );
}

function CompactStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="font-mono text-lg font-extrabold text-ink sm:text-2xl">
        {value}
      </p>
      <p className="text-[0.6rem] font-bold uppercase tracking-wide text-ink/45 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border-2 border-berry bg-white px-2 py-4 shadow-sm">
      <p className="text-2xl font-extrabold text-ink sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink/50 sm:text-sm">
        {label}
      </p>
    </div>
  );
}
