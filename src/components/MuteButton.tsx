"use client";

import { useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/storage";
import { cancelSpeech } from "@/lib/speech";
import { useLanguage } from "@/lib/i18n";

export default function MuteButton() {
  const { t } = useLanguage();
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  return (
    <button
      type="button"
      aria-label={muted ? t("enableSounds") : t("muteSounds")}
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
        if (next) cancelSpeech();
      }}
      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink/20 bg-white text-xl shadow-sm transition-transform active:scale-90"
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔉"}</span>
    </button>
  );
}
