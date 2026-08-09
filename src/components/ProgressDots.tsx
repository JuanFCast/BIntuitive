"use client";

import { useLanguage } from "@/lib/i18n";

type ProgressDotsProps = {
  total: number;
  current: number;
  starsByRound: boolean[];
};

export default function ProgressDots({
  total,
  current,
  starsByRound,
}: ProgressDotsProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={t("progressQuestion", {
        current: Math.min(current + 1, total),
        total,
      })}
    >
      {Array.from({ length: total }, (_, i) => {
        const done = i < starsByRound.length;
        const earned = starsByRound[i];
        return (
          <span
            key={i}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-all sm:h-10 sm:w-10 sm:text-xl ${
              done
                ? "bg-sunsoft"
                : i === current
                  ? "scale-110 border-4 border-sun bg-white"
                  : "border-2 border-ink/20 bg-white"
            }`}
          >
            {done ? (earned ? "⭐" : "💛") : ""}
          </span>
        );
      })}
    </div>
  );
}
