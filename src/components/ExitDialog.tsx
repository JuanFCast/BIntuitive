"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { shuffle } from "@/lib/gameEngine";
import { useLanguage } from "@/lib/i18n";

type ExitDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Puerta para adultos: una suma sencilla evita que el niño
 * salga del juego sin querer.
 */
export default function ExitDialog({ open, onClose }: ExitDialogProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);

  const challenge = useMemo(() => {
    const a = 2 + Math.floor(Math.random() * 5);
    const b = 3 + Math.floor(Math.random() * 5);
    const answer = a + b;
    const options = shuffle([answer, answer - 2, answer + 3]);
    return { a, b, answer, options };
    // Nueva suma cada vez que se abre el diálogo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("exitDialogAria")}
    >
      <div className="animate-pop w-full max-w-sm rounded-3xl border-4 border-sky bg-white p-6 text-center shadow-2xl">
        <p className="text-2xl font-extrabold text-ink">{t("exitTitle")}</p>
        <p className="mt-2 text-lg font-semibold text-ink/70">
          {t("adultQuestion")}
        </p>
        <p className="mt-1 text-3xl font-extrabold text-ink">
          {challenge.a} + {challenge.b} = ?
        </p>
        {failed && (
          <p className="mt-2 text-base font-bold text-coral">
            {t("askAdult")}
          </p>
        )}
        <div className="mt-4 flex justify-center gap-3">
          {challenge.options.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (value === challenge.answer) {
                  router.push("/");
                } else {
                  setFailed(true);
                }
              }}
              className="min-h-16 min-w-16 rounded-2xl border-4 border-sky bg-skysoft text-2xl font-extrabold text-ink transition-transform active:scale-90"
            >
              {value}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            onClose();
          }}
          className="mt-5 min-h-14 w-full rounded-full border-b-8 border-mint bg-mintsoft px-6 py-2 text-xl font-extrabold text-ink transition-transform active:scale-95 active:border-b-4"
        >
          ⬅️ {t("continuePlaying")}
        </button>
      </div>
    </div>
  );
}
