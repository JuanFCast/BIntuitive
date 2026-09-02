"use client";

import { useEffect } from "react";
import BrandMark from "./BrandMark";
import ResultActions from "./ResultActions";
import { playCelebrationSound } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { isMuted } from "@/lib/storage";
import { useLanguage } from "@/lib/i18n";

type ResultsScreenProps = {
  stars: number;
  total: number;
  onPlayAgain: () => void;
};

export default function ResultsScreen({
  stars,
  total,
  onPlayAgain,
}: ResultsScreenProps) {
  const { language, t } = useLanguage();
  const text =
    stars === total
      ? t("resultsPerfect")
      : stars >= total - 1
        ? t("resultsAlmostPerfect")
        : stars >= Math.ceil(total / 2)
          ? t("resultsGood")
          : t("resultsTryAgain");

  useEffect(() => {
    playCelebrationSound();
  }, []);

  useEffect(() => {
    if (!isMuted()) {
      speak(text, language);
    }
  }, [language, text]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center gap-5 bg-cream px-6 py-10 text-center text-ink">
      <BrandMark
        size={140}
        className="animate-pop shadow-[0_18px_50px_rgba(255,196,0,0.2)]"
      />

      <h1 className="animate-pop text-4xl font-extrabold text-ink sm:text-5xl">
        {text}
      </h1>

      <div
        className="flex gap-2 text-5xl sm:text-6xl"
        role="img"
        aria-label={t("resultsStarsAria", { stars, total })}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={i < stars ? "animate-pop" : "opacity-30"}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            ⭐
          </span>
        ))}
      </div>

      {stars === total && (
        <p className="animate-pop rounded-full border-4 border-sun bg-sun px-6 py-2 text-2xl font-extrabold text-black">
          {t("goldMedal")}
        </p>
      )}

      <ResultActions
        playAgainLabel={t("playAgain")}
        onPlayAgain={onPlayAgain}
      />
    </main>
  );
}
