"use client";

import { useEffect, useState } from "react";
import { isSpeechAvailable, speak, warmUpVoices } from "@/lib/speech";
import { isMuted } from "@/lib/storage";
import { useLanguage } from "@/lib/i18n";

type AudioButtonProps = {
  text: string;
  autoPlay?: boolean;
  /** Etiqueta accesible alternativa; por defecto "escuchar otra vez". */
  label?: string;
};

export default function AudioButton({
  text,
  autoPlay = false,
  label,
}: AudioButtonProps) {
  const { language, t } = useLanguage();
  const [available, setAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setAvailable(isSpeechAvailable());
    warmUpVoices();
  }, []);

  useEffect(() => {
    if (autoPlay && available && !isMuted()) {
      const timer = setTimeout(() => {
        setSpeaking(true);
        speak(text, language, () => setSpeaking(false));
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [text, autoPlay, available, language]);

  if (!available) return null;

  return (
    <button
      type="button"
      aria-label={label ?? t("listenAgain")}
      onClick={() => {
        setSpeaking(true);
        speak(text, language, () => setSpeaking(false));
      }}
      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-sky bg-skysoft text-3xl shadow-md transition-transform active:scale-90 ${
        speaking ? "animate-wiggle" : ""
      }`}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}
