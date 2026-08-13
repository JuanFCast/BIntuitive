"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

type ExitDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function ExitDialog({ open, onClose }: ExitDialogProps) {
  const router = useRouter();
  const { t } = useLanguage();

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
          {t("exitMessage")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/hexagons")}
          className="mt-5 min-h-14 w-full rounded-full border-b-8 border-coral bg-coralsoft px-6 py-2 text-xl font-extrabold text-ink transition-transform active:scale-95 active:border-b-4"
        >
          {t("leaveLesson")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 min-h-14 w-full rounded-full border-b-8 border-mint bg-mintsoft px-6 py-2 text-xl font-extrabold text-ink transition-transform active:scale-95 active:border-b-4"
        >
          ⬅️ {t("continuePlaying")}
        </button>
      </div>
    </div>
  );
}
