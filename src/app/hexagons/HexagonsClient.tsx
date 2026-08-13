"use client";

import HexagonCard from "@/components/HexagonCard";
import { hexagons } from "@/data/categories";
import { useLanguage } from "@/lib/i18n";

export default function HexagonsClient() {
  const { language, t } = useLanguage();

  return (
    <main className="relative flex min-h-full flex-col items-center overflow-hidden bg-cream px-4 py-4 text-ink sm:px-6 sm:py-6">
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

      <header className="hexagons-header relative z-10 mt-1 text-center sm:mt-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#9b7400] sm:text-sm">
          {t("navExplore")}
        </p>
        <h1 className="mt-0.5 text-3xl font-extrabold leading-tight sm:text-5xl">
          {t("hexagonsHeading")}
        </h1>
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
