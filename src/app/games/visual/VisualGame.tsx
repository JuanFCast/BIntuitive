"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import Mascot from "@/components/Mascot";
import MuteButton from "@/components/MuteButton";
import { useLanguage } from "@/lib/i18n";
import { playCelebrationSound, playCorrectSound, playWrongSound } from "@/lib/sounds";
import {
  createFirstVisualCard,
  createNextVisualCard,
  formatVisualTime,
  VISUAL_ERROR_PENALTY_MS,
  VISUAL_ROUNDS,
  type VisualCard,
} from "@/lib/visualGame";

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
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const startGame = () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const firstCard = createFirstVisualCard();
    const nextCard = createNextVisualCard(firstCard, 2);
    const start = Date.now();
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

  const finishGame = (finalErrors: number) => {
    setFinalTime(
      Date.now() - startedAt + finalErrors * VISUAL_ERROR_PENALTY_MS,
    );
    setCompleted(VISUAL_ROUNDS);
    setLocked(false);
    setPhase("results");
    playCelebrationSound();
  };

  const handleTap = (symbolId: string) => {
    if (locked || !playerCard || phase !== "playing") return;

    if (symbolId !== targetId) {
      setErrors((current) => current + 1);
      setFlash({ id: symbolId, type: "wrong" });
      setLocked(true);
      playWrongSound();
      feedbackTimer.current = setTimeout(() => {
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

    feedbackTimer.current = setTimeout(() => {
      setFlash(null);
      if (nextCompleted >= VISUAL_ROUNDS) {
        finishGame(errors);
        return;
      }

      const next = createNextVisualCard(playerCard, playerCard.id + 1);
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
  const accuracy = Math.round(
    (VISUAL_ROUNDS / Math.max(VISUAL_ROUNDS + errors, 1)) * 100,
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
          <Mascot expression="pista" size={130} className="animate-float" />
          <div>
            <p className="text-5xl" aria-hidden="true">👀</p>
            <h1 className="mt-2 text-4xl font-extrabold text-ink sm:text-5xl">
              {t("visualTitle")}
            </h1>
            <p className="mt-3 text-xl font-bold text-ink/70">
              {t("visualIntro")}
            </p>
            <p className="mx-auto mt-2 max-w-lg text-base font-semibold text-ink/55 sm:text-lg">
              {t("visualHowTo")}
            </p>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="min-h-16 rounded-full border-b-8 border-[#e0a800] bg-sun px-10 py-3 text-2xl font-extrabold text-ink shadow-xl transition-transform active:scale-95 active:border-b-4"
          >
            {t("visualStart")}
          </button>
        </section>
      )}

      {phase === "playing" && baseCard && playerCard && (
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 pb-4 pt-3 text-center sm:gap-4 sm:pt-5">
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm sm:px-4">
            <span className="text-left text-xs font-extrabold text-ink/65 sm:text-base">
              {t("visualProgress", {
                current: Math.min(completed + 1, VISUAL_ROUNDS),
                total: VISUAL_ROUNDS,
              })}
            </span>
            <span className="font-mono text-xl font-extrabold tabular-nums text-ink">
              ⏱️ {formatVisualTime(elapsedTime)}
            </span>
            <span
              className="text-right text-xs font-extrabold text-ink/65 sm:text-base"
              aria-label={`${t("visualMistakes")}: ${errors}`}
            >
              <span aria-hidden="true">❌</span> {errors}
            </span>
          </div>

          <h1 className="text-xl font-extrabold text-ink sm:text-3xl">
            {t("visualInstruction")}
          </h1>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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
        </section>
      )}

      {phase === "results" && (
        <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl flex-col items-center justify-center gap-5 text-center">
          <Mascot expression="feliz" size={140} className="animate-float" />
          <div>
            <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">
              {t("visualResultsTitle")}
            </h1>
            <p className="mt-2 text-xl font-semibold text-ink/65">
              {t("visualResultsText", { total: VISUAL_ROUNDS })}
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-3">
            <Stat label={t("visualTime")} value={formatVisualTime(finalTime)} />
            <Stat label={t("visualAccuracy")} value={`${accuracy}%`} />
            <Stat label={t("visualMistakes")} value={errors} />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startGame}
              className="min-h-14 flex-1 rounded-full border-b-8 border-[#e0a800] bg-sun px-6 py-3 text-xl font-extrabold text-ink shadow-lg active:scale-95 active:border-b-4"
            >
              {t("visualPlayAgain")}
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
        className={`absolute left-1/2 top-0 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border-2 px-5 py-1 text-sm font-extrabold uppercase tracking-wider text-ink shadow-sm sm:px-7 sm:text-base ${labelClass}`}
      >
        {label}
      </p>
      <div
        className={`relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border-4 bg-white shadow-xl sm:border-[6px] ${borderClass}`}
      >
        {card.symbols.map((symbol) => {
          const isFlashing = flash?.id === symbol.id;
          const flashClass = isFlashing
            ? flash.type === "correct"
              ? "bg-mintsoft ring-4 ring-mint"
              : "animate-shake bg-coralsoft ring-4 ring-coral"
            : "";
          const sharedClass =
            "absolute flex h-[clamp(3rem,16vw,5.5rem)] w-[clamp(3rem,16vw,5.5rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl text-[clamp(2.15rem,11vw,4.25rem)] leading-none transition-transform";
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-white px-2 py-3 text-center shadow-sm">
      <p className="text-xl font-extrabold text-ink sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink/50 sm:text-sm">
        {label}
      </p>
    </div>
  );
}
