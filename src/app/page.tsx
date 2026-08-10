"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import LanguageToggle from "@/components/LanguageToggle";
import { getProgress } from "@/lib/storage";
import { useLanguage } from "@/lib/i18n";

export default function HomePage() {
  const [totalStars, setTotalStars] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    setTotalStars(getProgress().totalStars);
  }, []);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#080808] px-6 py-10 text-center text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(255,196,0,0.18), transparent 38%)",
        }}
      />
      <LanguageToggle className="fixed right-4 top-4 z-10 sm:right-8 sm:top-6" />

      <BrandMark
        size={230}
        priority
        className="relative z-[1] shadow-[0_24px_70px_rgba(255,196,0,0.24)] sm:h-[280px] sm:w-[280px]"
      />

      <h1 className="relative z-[1] mt-5 text-5xl font-extrabold tracking-tight sm:text-7xl">
        Bee<span className="text-sun">Smart</span>
      </h1>
      <p className="relative z-[1] mt-3 max-w-md text-lg font-semibold text-white/65 sm:text-2xl">
        {t("homeTagline")}
      </p>

      {totalStars > 0 && (
        <p
          className="relative z-[1] mt-4 rounded-full border-2 border-sun/60 bg-sun/10 px-5 py-2 text-lg font-bold text-sun"
          aria-label={t("totalStarsAria", { count: totalStars })}
        >
          ⭐ {t("starsEarned", { count: totalStars })}
        </p>
      )}

      <Link
        href="/hexagons"
        className="relative z-[1] mt-7 flex min-h-16 min-w-64 items-center justify-center rounded-2xl border-b-[6px] border-[#9b7600] bg-sun px-12 py-4 text-3xl font-extrabold text-black shadow-[0_18px_50px_rgba(255,196,0,0.18)] transition-transform active:translate-y-1 active:border-b-2 sm:min-h-20 sm:text-4xl"
      >
        {t("play")} <span aria-hidden="true" className="ml-3">→</span>
      </Link>

      <p className="relative z-[1] mt-7 text-sm font-semibold text-white/35">
        {t("homeFooter")}
      </p>
    </main>
  );
}
