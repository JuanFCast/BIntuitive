"use client";

import Mascot from "./Mascot";

export type FeedbackType = "correct" | "almost" | "reveal" | null;

type FeedbackOverlayProps = {
  type: FeedbackType;
  hint?: string;
};

const CONFETTI = ["⭐", "🌟", "✨", "🎉", "💛", "⭐", "✨", "🌟", "🎉", "💛", "⭐", "✨"];

export default function FeedbackOverlay({ type, hint }: FeedbackOverlayProps) {
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
        <div className="animate-pop flex items-center gap-4 rounded-3xl border-4 border-mint bg-white px-8 py-5 shadow-xl">
          <Mascot expression="feliz" size={80} />
          <p className="text-3xl font-extrabold text-ink sm:text-4xl">
            ¡Muy bien! 🎉
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
          <Mascot expression="pista" size={64} />
          <div>
            <p className="text-xl font-extrabold text-ink sm:text-2xl">
              Casi... ¡intenta otra vez!
            </p>
            {hint && (
              <p className="text-base font-semibold text-ink/70 sm:text-lg">
                Pista: {hint}
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
      <div className="flex items-center gap-3 rounded-3xl border-4 border-sky bg-white px-6 py-4 shadow-xl">
        <Mascot expression="normal" size={64} />
        <p className="text-xl font-extrabold text-ink sm:text-2xl">
          ¡Mira, esta era! La próxima la logras 💪
        </p>
      </div>
    </div>
  );
}
