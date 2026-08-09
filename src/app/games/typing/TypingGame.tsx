"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import Mascot from "@/components/Mascot";
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
  const phaseRef = useRef<Phase>(phase);
  const passageRef = useRef("");
  const typedRef = useRef("");
  const startedAtRef = useRef(0);
  const mistakesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase === "ready") inputRef.current?.focus();
  }, [phase]);

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
          href="/worlds"
          className="flex min-h-12 items-center rounded-full border-2 border-ink/15 bg-white px-4 text-base font-extrabold text-ink shadow-sm active:scale-95"
        >
          ← <span className="hidden sm:inline">{t("backToWorlds")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <MuteButton />
        </div>
      </header>

      {phase === "intro" && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <Mascot expression="normal" size={130} className="animate-float" />
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
            className="min-h-16 rounded-full border-b-8 border-[#8b63df] bg-berrysoft px-10 py-3 text-2xl font-extrabold text-ink shadow-xl transition-transform active:scale-95 active:border-b-4"
          >
            {t("typingStart")}
          </button>
        </section>
      )}

      {(phase === "ready" || phase === "playing") && (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-3 pb-5 pt-3 sm:gap-4 sm:pt-5">
          <div className="flex items-end justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-ink/45">
                {t("typingTime")}
              </p>
              <p
                className={`font-mono text-3xl font-extrabold tabular-nums ${
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

          <div className="max-h-[42dvh] overflow-y-auto rounded-3xl border-4 border-berry bg-white p-4 shadow-xl sm:max-h-[48dvh] sm:p-6">
            <p
              translate="no"
              className="notranslate whitespace-pre-wrap break-words font-mono text-lg font-semibold leading-8 sm:text-2xl sm:leading-10"
            >
              {[...passage].map((character, index) => {
                let className = "text-ink/35";
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
                  <span key={index} className={className}>
                    {character}
                  </span>
                );
              })}
            </p>
          </div>

          <div>
            {phase === "ready" && (
              <p className="mb-2 text-center text-sm font-bold text-berry sm:text-base">
                {t("typingStartHint")}
              </p>
            )}
            <label className="sr-only" htmlFor="typing-input">
              {t("typingInputLabel")}
            </label>
            <textarea
              id="typing-input"
              ref={inputRef}
              value={typed}
              onChange={(event) => handleInput(event.target.value)}
              onPaste={(event) => event.preventDefault()}
              rows={3}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder={t("typingInputPlaceholder")}
              className="w-full resize-none rounded-2xl border-4 border-berry bg-berrysoft p-4 font-mono text-lg font-semibold text-ink shadow-lg outline-none placeholder:text-ink/35 focus:ring-4 focus:ring-berry/25 sm:text-xl"
            />
          </div>
        </section>
      )}

      {phase === "results" && result && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <Mascot expression="feliz" size={140} className="animate-float" />
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
              className="min-h-14 flex-1 rounded-full border-b-8 border-[#8b63df] bg-berrysoft px-6 py-3 text-xl font-extrabold text-ink shadow-lg active:scale-95 active:border-b-4"
            >
              {t("typingPlayAgain")}
            </button>
            <Link
              href="/worlds"
              className="flex min-h-14 flex-1 items-center justify-center rounded-full border-b-8 border-sky bg-skysoft px-6 py-3 text-xl font-extrabold text-ink shadow-lg active:scale-95 active:border-b-4"
            >
              {t("backToWorlds")}
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
