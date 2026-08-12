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
    <main className="flex min-h-dvh flex-col items-center bg-cream px-4 py-4 text-ink sm:h-dvh sm:overflow-hidden sm:px-6 sm:py-6">
      <div className="flex w-full max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="flex h-12 min-w-12 items-center justify-center rounded-full border-2 border-ink/20 bg-white px-4 font-extrabold text-ink shadow-sm transition-transform active:scale-90"
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

      <section
        className="hexagons-grid relative mt-10 aspect-[1.98] w-full max-w-2xl shrink-0 sm:mt-8"
        aria-label={t("hexagonsHeading")}
      >
        {hexagons.map((hexagon) => (
          <HexagonCard
            key={hexagon.id}
            hexagon={hexagon}
            language={language}
          />
        ))}
      </section>
    </main>
  );
}
