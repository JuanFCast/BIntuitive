"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import HexagonCard from "@/components/HexagonCard";
import LanguageToggle from "@/components/LanguageToggle";
import { hexagons } from "@/data/categories";
import { useLanguage } from "@/lib/i18n";

export default function HexagonsClient() {
  const { language, t } = useLanguage();

  return (
    <main className="flex min-h-dvh flex-col items-center bg-[#080808] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="flex w-full max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="flex h-12 min-w-12 items-center justify-center rounded-full border-2 border-white/15 bg-white/10 px-4 font-extrabold text-white shadow-sm transition-transform active:scale-90"
          aria-label={t("back")}
        >
          ← <span className="hidden sm:inline">{t("back")}</span>
        </Link>
        <LanguageToggle />
      </div>

      <header className="hexagons-header mt-3 flex flex-col items-center gap-2 text-center sm:mt-5 sm:flex-row sm:gap-4">
        <BrandMark size={76} className="shadow-[0_8px_24px_rgba(255,196,0,0.25)]" />
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-sun sm:text-sm">
            BIntuitive
          </p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-5xl">
            {t("hexagonsHeading")}
          </h1>
        </div>
      </header>

      <section className="hexagons-grid flex w-full max-w-5xl flex-1 flex-wrap content-center justify-center gap-x-3 gap-y-4 py-5 sm:gap-x-5 sm:gap-y-6 sm:py-8">
        {hexagons.map((hexagon, index) => (
          <HexagonCard
            key={hexagon.id}
            hexagon={hexagon}
            language={language}
            index={index}
          />
        ))}
      </section>
    </main>
  );
}
