"use client";

import { useEffect } from "react";
import Link from "next/link";
import BrandMark from "./BrandMark";
import { playCelebrationSound } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { isMuted } from "@/lib/storage";
import { useLanguage } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";

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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#080808] px-6 py-10 text-center text-white">
      <LanguageToggle className="fixed right-4 top-4 z-10 sm:right-8 sm:top-6" />

      <BrandMark
        size={150}
        className="animate-pop shadow-[0_18px_50px_rgba(255,196,0,0.2)]"
      />

      <h1 className="animate-pop text-4xl font-extrabold text-white sm:text-5xl">
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

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onPlayAgain}
          className="min-h-16 rounded-2xl border-b-8 border-[#9b7600] bg-sun px-10 py-4 text-2xl font-extrabold text-black shadow-lg transition-transform active:scale-95 active:border-b-4 sm:text-3xl"
        >
          {t("playAgain")}
        </button>
        <Link
          href="/hexagons"
          className="flex min-h-16 items-center justify-center rounded-2xl border-b-8 border-white/30 bg-white px-10 py-4 text-2xl font-extrabold text-black shadow-lg transition-transform active:scale-95 active:border-b-4 sm:text-3xl"
        >
          {t("anotherHexagon")}
        </Link>
      </div>
    </main>
  );
}
