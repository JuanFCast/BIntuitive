"use client";

import { useEffect } from "react";
import Link from "next/link";
import Mascot from "./Mascot";
import { playCelebrationSound } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { isMuted } from "@/lib/storage";

type ResultsScreenProps = {
  stars: number;
  total: number;
  onPlayAgain: () => void;
};

function message(stars: number, total: number): string {
  if (stars === total) return "¡Increíble! ¡Lo lograste todo!";
  if (stars >= total - 1) return "¡Súper! ¡Casi perfecto!";
  if (stars >= Math.ceil(total / 2)) return "¡Muy bien! ¡Sigue así!";
  return "¡Buen intento! ¡Cada vez lo haces mejor!";
}

export default function ResultsScreen({
  stars,
  total,
  onPlayAgain,
}: ResultsScreenProps) {
  const text = message(stars, total);

  useEffect(() => {
    playCelebrationSound();
    if (!isMuted()) {
      speak(text);
    }
  }, [text]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-cream px-6 py-10 text-center">
      <div className="animate-float">
        <Mascot expression="feliz" size={150} />
      </div>

      <h1 className="animate-pop text-4xl font-extrabold text-ink sm:text-5xl">
        {text}
      </h1>

      <div
        className="flex gap-2 text-5xl sm:text-6xl"
        role="img"
        aria-label={`Ganaste ${stars} de ${total} estrellas`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={i < stars ? "animate-pop" : "opacity-30"}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            ⭐
          </span>
        ))}
      </div>

      {stars === total && (
        <p className="animate-pop rounded-full border-4 border-sun bg-sunsoft px-6 py-2 text-2xl font-extrabold">
          🏅 ¡Medalla de oro!
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onPlayAgain}
          className="min-h-16 rounded-full border-b-8 border-mint bg-mintsoft px-10 py-4 text-2xl font-extrabold text-ink shadow-lg transition-transform active:scale-95 active:border-b-4 sm:text-3xl"
        >
          🔁 Jugar otra vez
        </button>
        <Link
          href="/categorias"
          className="flex min-h-16 items-center justify-center rounded-full border-b-8 border-sky bg-skysoft px-10 py-4 text-2xl font-extrabold text-ink shadow-lg transition-transform active:scale-95 active:border-b-4 sm:text-3xl"
        >
          🌍 Otro mundo
        </Link>
      </div>
    </main>
  );
}
