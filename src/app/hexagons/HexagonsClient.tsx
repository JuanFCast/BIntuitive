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
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-cream px-4 py-4 text-ink sm:h-dvh sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="hive-ambient-cluster hive-ambient-cluster-left">
          <span className="hive-ambient hive-ambient-one" />
          <span className="hive-ambient hive-ambient-two" />
          <span className="hive-ambient hive-ambient-three" />
        </div>
        <div className="hive-ambient-cluster hive-ambient-cluster-right">
          <span className="hive-ambient hive-ambient-one" />
          <span className="hive-ambient hive-ambient-two" />
          <span className="hive-ambient hive-ambient-three" />
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="flex h-12 min-w-12 items-center justify-center rounded-full border-2 border-ink/20 bg-white px-4 font-extrabold text-ink shadow-sm transition-transform active:scale-90"
          aria-label={t("back")}
        >
          ← <span className="hidden sm:inline">{t("back")}</span>
        </Link>
        <LanguageToggle />
      </div>

      <header className="hexagons-header relative z-10 mt-2 flex flex-col items-center gap-1 text-center sm:mt-4 sm:flex-row sm:gap-3">
        <BrandMark size={68} className="shadow-[0_6px_18px_rgba(255,196,0,0.18)]" />
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-sun sm:text-sm">
            BIntuitive
          </p>
          <h1 className="mt-0.5 text-3xl font-extrabold leading-tight sm:text-5xl">
            {t("hexagonsHeading")}
          </h1>
        </div>
      </header>

      <section
        className="hexagons-grid relative z-10 mt-4 w-full shrink-0 sm:mt-5"
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
