"use client";

import BrandMark from "./BrandMark";
import Confetti from "./Confetti";
import { useLanguage } from "@/lib/i18n";

export type FeedbackType = "correct" | "almost" | "reveal" | null;

type FeedbackOverlayProps = {
  type: FeedbackType;
  hint?: string;
};

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
        <Confetti />
        {/*
          El acierto es el momento por el que se juega, así que tiene la forma
          de un premio y no de un aviso: la tarjeta es de menta con el canto
          grueso de los botones, y la abeja de la marca entra con un pequeño
          rebote. La abeja es decorativa; lo que se anuncia es el texto.
        */}
        <div className="animate-enter flex items-center gap-4 rounded-3xl border-4 border-b-[10px] border-mint border-b-[#43c27e] bg-mintsoft py-3 pl-3 pr-7 shadow-xl sm:gap-5 sm:pr-9">
          <span className="animate-bee-in block shrink-0" aria-hidden="true">
            <BrandMark size={72} className="h-16 w-16 sm:h-[72px] sm:w-[72px]" />
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
      <div className="flex items-center gap-3 rounded-3xl border-4 border-sky bg-white px-6 py-4 shadow-xl">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-skysoft text-2xl font-black text-ink"
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
