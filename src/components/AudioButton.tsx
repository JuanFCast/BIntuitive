"use client";

import { useEffect, useState } from "react";
import { isSpeechAvailable, speak, warmUpVoices } from "@/lib/speech";
import { isMuted } from "@/lib/storage";

type AudioButtonProps = {
  text: string;
  autoPlay?: boolean;
};

export default function AudioButton({ text, autoPlay = false }: AudioButtonProps) {
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
        speak(text, () => setSpeaking(false));
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [text, autoPlay, available]);

  if (!available) return null;

  return (
    <button
      type="button"
      aria-label="Escuchar la instrucción otra vez"
      onClick={() => {
        setSpeaking(true);
        speak(text, () => setSpeaking(false));
      }}
      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-sky bg-skysoft text-3xl shadow-md transition-transform active:scale-90 ${
        speaking ? "animate-wiggle" : ""
      }`}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}
