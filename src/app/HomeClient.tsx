"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import HexagonCard from "@/components/HexagonCard";
import HexagonRow from "@/components/HexagonRow";
import { hexagons } from "@/data/categories";
import { honeycombLayout, HONEYCOMB_BREAKPOINTS } from "@/lib/honeycomb";
import { useDocumentTitle } from "@/lib/documentTitle";
import { useExploreView, setExploreView } from "@/lib/exploreView";
import { useFavorites } from "@/lib/favorites";
import { useLanguage } from "@/lib/i18n";
import { playTapSound } from "@/lib/sounds";

/*
 * El panal se calcula a partir del número de fichas que se enseñan, no del
 * total: con el filtro de favoritos puesto son menos, y una rejilla calculada
 * para diez dejaría huecos donde no hay nada. `honeycombLayout` ya sabe
 * repartir cualquier cantidad, así que basta con decirle cuántas van.
 *
 * Se calculan los tres anchos de columna a la vez y las medias queries eligen,
 * igual que antes: así no hace falta escuchar el tamaño de la ventana ni
 * esperar a que monte el componente para saber qué sitio ocupa el panal, que
 * es lo que provocaría un salto al cargar.
 */
function layoutsFor(count: number) {
  return HONEYCOMB_BREAKPOINTS.map((breakpoint) => ({
    key: breakpoint.key,
    layout: honeycombLayout(count, breakpoint.columns),
  }));
}

type Layouts = ReturnType<typeof layoutsFor>;

function gridStyleFor(layouts: Layouts): CSSProperties {
  return Object.fromEntries(
    layouts.map(({ key, layout }) => [
      `--hc-aspect-${key}`,
      layout.aspectRatio,
    ]),
  ) as CSSProperties;
}

function cellStyleFor(layouts: Layouts, index: number): CSSProperties {
  return Object.fromEntries(
    layouts.flatMap(({ key, layout }) => {
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
  useDocumentTitle(t("navHome"));

  const view = useExploreView();
  const favorites = useFavorites();
  /*
   * El filtro **no** se recuerda, al contrario que la vista. Volver a abrir la
   * aplicación y encontrarse solo tres fichas, sin saber por qué, es la mejor
   * forma de pensar que se ha perdido el resto; la vista en cambio es una
   * forma de mirar y sí aguanta entre visitas.
   */
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const visible = useMemo(
    () =>
      onlyFavorites
        ? hexagons.filter((hexagon) => favorites.includes(hexagon.id))
        : hexagons,
    [onlyFavorites, favorites],
  );

  const layouts = useMemo(() => layoutsFor(visible.length), [visible.length]);

  const toggleView = () => {
    setExploreView(view === "honeycomb" ? "list" : "honeycomb");
    playTapSound();
  };

  const toggleFilter = () => {
    setOnlyFavorites((current) => !current);
    playTapSound();
  };

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

      {/*
        Los dos controles de la pantalla, juntos y pequeños: no compiten con el
        panal, que es lo que hay que mirar. El de favoritos solo aparece cuando
        hay alguno, porque un filtro que no puede filtrar nada es un botón que
        enseña una pantalla vacía.
      */}
      <div className="relative z-10 mt-3 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleView}
          aria-pressed={view === "list"}
          className="flex min-h-12 items-center gap-2 rounded-full border-2 border-ink/15 bg-white px-4 text-sm font-extrabold text-ink shadow-sm transition-transform active:scale-95 sm:text-base"
        >
          <span aria-hidden="true">{view === "honeycomb" ? "☰" : "⬡"}</span>
          {t(view === "honeycomb" ? "exploreViewList" : "exploreViewHoneycomb")}
        </button>

        {favorites.length > 0 && (
          <button
            type="button"
            onClick={toggleFilter}
            aria-pressed={onlyFavorites}
            className={`flex min-h-12 items-center gap-2 rounded-full border-2 px-4 text-sm font-extrabold shadow-sm transition-transform active:scale-95 sm:text-base ${
              onlyFavorites
                ? "border-sun bg-sun text-black"
                : "border-ink/15 bg-white text-ink"
            }`}
          >
            <span aria-hidden="true">★</span>
            {t("exploreOnlyFavorites")}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="relative z-10 mt-10 max-w-sm text-balance text-center text-lg font-bold leading-snug text-ink/60">
          {t("exploreNoFavorites")}
        </p>
      ) : view === "honeycomb" ? (
        <section
          className="hexagons-grid relative z-10 mt-4 w-full shrink-0 sm:mt-6"
          style={gridStyleFor(layouts)}
          aria-label={t("hexagonsGridAria")}
        >
          {visible.map((hexagon, index) => (
            <HexagonCard
              key={hexagon.id}
              hexagon={hexagon}
              language={language}
              favorite={favorites.includes(hexagon.id)}
              style={cellStyleFor(layouts, index)}
            />
          ))}
        </section>
      ) : (
        <ul
          className="relative z-10 mt-4 flex w-full max-w-2xl flex-col gap-2 sm:mt-6 sm:gap-3"
          aria-label={t("hexagonsGridAria")}
        >
          {visible.map((hexagon) => (
            <HexagonRow
              key={hexagon.id}
              hexagon={hexagon}
              language={language}
              favorite={favorites.includes(hexagon.id)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
