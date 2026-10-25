"use client";

import type { CSSProperties } from "react";
import HexagonCard from "@/components/HexagonCard";
import { hexagons } from "@/data/categories";
import { honeycombLayout, HONEYCOMB_BREAKPOINTS } from "@/lib/honeycomb";
import { useLanguage } from "@/lib/i18n";

/*
 * El panal se calcula una vez, al cargar el módulo: depende del número de
 * hexágonos, que es un dato del repositorio, no del estado. Se calculan los
 * tres a la vez y las medias queries eligen; así no hace falta escuchar el
 * tamaño de la ventana ni esperar a que monte el componente para saber qué
 * sitio ocupa el panal, que es lo que provocaría un salto al cargar.
 */
const LAYOUTS = HONEYCOMB_BREAKPOINTS.map((breakpoint) => ({
  key: breakpoint.key,
  layout: honeycombLayout(hexagons.length, breakpoint.columns),
}));

const gridStyle = Object.fromEntries(
  LAYOUTS.map(({ key, layout }) => [`--hc-aspect-${key}`, layout.aspectRatio]),
) as CSSProperties;

function cellStyle(index: number): CSSProperties {
  return Object.fromEntries(
    LAYOUTS.flatMap(({ key, layout }) => {
      const cell = layout.cells[index];
      return [
        [`--hc-cell-${key}`, `${layout.cellWidth}%`],
        [`--hc-left-${key}`, `${cell.left}%`],
        [`--hc-top-${key}`, `${cell.top}%`],
      ];
    }),
  ) as CSSProperties;
}

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
        <h1 className="font-display text-balance text-[clamp(1.9rem,6vw,3.25rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
          {t("hexagonsCta")}
        </h1>
      </header>

      <section
        className="hexagons-grid relative z-10 mt-4 w-full shrink-0 sm:mt-6"
        style={gridStyle}
        aria-label={t("hexagonsGridAria")}
      >
        {hexagons.map((hexagon, index) => (
          <HexagonCard
            key={hexagon.id}
            hexagon={hexagon}
            language={language}
            style={cellStyle(index)}
          />
        ))}
      </section>
    </main>
  );
}
