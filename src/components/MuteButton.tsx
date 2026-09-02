"use client";

import { setMuted } from "@/lib/storage";
import { useMuted } from "@/lib/preferences";
import { cancelSpeech } from "@/lib/speech";
import { useLanguage } from "@/lib/i18n";

type MuteButtonProps = {
  className?: string;
};

export default function MuteButton({ className = "" }: MuteButtonProps) {
  const { t } = useLanguage();
  // Lee la preferencia compartida: silenciar desde el menú superior también
  // cambia este botón, y al revés.
  const muted = useMuted();

  return (
    <button
      type="button"
      aria-label={muted ? t("enableSounds") : t("muteSounds")}
      onClick={() => {
        const next = !muted;
        setMuted(next);
        if (next) cancelSpeech();
      }}
      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink/20 bg-white text-xl shadow-sm transition-transform active:scale-90 ${className}`}
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔉"}</span>
    </button>
  );
}
