"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import { getProgress } from "@/lib/storage";

export default function HomePage() {
  const [totalStars, setTotalStars] = useState(0);

  useEffect(() => {
    setTotalStars(getProgress().totalStars);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-cream px-6 py-10 text-center">
      <div className="animate-float">
        <Mascot expression="feliz" size={170} />
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight text-ink sm:text-7xl">
        Bee <span className="text-sun drop-shadow-[0_2px_0_rgba(59,51,85,0.3)]">Smart</span>
      </h1>
      <p className="max-w-md text-xl font-semibold text-ink/70 sm:text-2xl">
        Escucha, piensa y ¡toca la respuesta correcta!
      </p>

      {totalStars > 0 && (
        <p
          className="rounded-full border-2 border-sun bg-sunsoft px-5 py-2 text-lg font-bold text-ink"
          aria-label={`Has ganado ${totalStars} estrellas en total`}
        >
          ⭐ {totalStars} estrellas ganadas
        </p>
      )}

      <Link
        href="/categorias"
        className="mt-4 flex min-h-20 items-center justify-center rounded-full border-b-8 border-[#e0a800] bg-sun px-16 py-5 text-4xl font-extrabold text-ink shadow-xl transition-transform active:scale-95 active:border-b-4 sm:text-5xl"
      >
        ▶️ ¡Jugar!
      </Link>

      <p className="mt-6 text-sm font-semibold text-ink/40">
        Para niños de 4 a 8 años · Sin anuncios · Sin internet
      </p>
    </main>
  );
}
