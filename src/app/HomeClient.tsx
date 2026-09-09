"use client";

import HexagonCard from "@/components/HexagonCard";
import { hexagons } from "@/data/categories";
import { useLanguage } from "@/lib/i18n";

export default function HomeClient() {
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

      {/*
        Una sola línea, y es una invitación: el nombre de la pantalla ya lo
        dice la pestaña encendida de la barra, y "elige un hexágono" sobraba
        teniendo el panal debajo. Esa frase sigue siendo la etiqueta del panal
        para quien lo escucha en vez de verlo.
      */}
      <header className="hexagons-header relative z-10 mt-1 text-center sm:mt-3">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
          {t("hexagonsCta")}
        </h1>
      </header>

      <section
        className="hexagons-grid relative z-10 mt-4 w-full shrink-0 sm:mt-5"
        aria-label={t("hexagonsGridAria")}
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
