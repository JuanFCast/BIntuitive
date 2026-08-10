"use client";

import { useLanguage } from "@/lib/i18n";

export type FeedbackType = "correct" | "almost" | "reveal" | null;

type FeedbackOverlayProps = {
  type: FeedbackType;
  hint?: string;
};

const CONFETTI = ["⭐", "🌟", "✨", "🎉", "💛", "⭐", "✨", "🌟", "🎉", "💛", "⭐", "✨"];

export default function FeedbackOverlay({ type, hint }: FeedbackOverlayProps) {
  const { t } = useLanguage();

  if (!type) return null;

  if (type === "correct") {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        {CONFETTI.map((piece, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="animate-fall absolute top-0 text-3xl sm:text-4xl"
            style={{
              left: `${6 + i * 8}%`,
              animationDelay: `${(i % 5) * 0.12}s`,
            }}
          >
            {piece}
          </span>
        ))}
        <div className="animate-pop flex items-center gap-4 rounded-3xl border-4 border-black bg-white px-8 py-5 shadow-xl">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sun text-4xl font-black text-black"
            aria-hidden="true"
          >
            ✓
          </span>
          <p className="text-3xl font-extrabold text-ink sm:text-4xl">
            {t("feedbackCorrect")}
          </p>
        </div>
      </div>
    );
  }

  if (type === "almost") {
    return (
      <div
        className="animate-fade-up pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 rounded-3xl border-4 border-sun bg-white px-6 py-4 shadow-xl">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sun text-3xl font-black text-black"
            aria-hidden="true"
          >
            !
          </span>
          <div>
            <p className="text-xl font-extrabold text-ink sm:text-2xl">
              {t("feedbackAlmost")}
            </p>
            {hint && (
              <p className="text-base font-semibold text-ink/70 sm:text-lg">
                {t("hintLabel", { hint })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // reveal: mostrar cuál era la correcta, con mensaje amable
  return (
    <div
      className="animate-fade-up pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-3xl border-4 border-black bg-white px-6 py-4 shadow-xl">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black text-2xl font-black text-sun"
          aria-hidden="true"
        >
          →
        </span>
        <p className="text-xl font-extrabold text-ink sm:text-2xl">
          {t("feedbackReveal")}
        </p>
      </div>
    </div>
  );
}
