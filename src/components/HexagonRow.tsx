"use client";

import Link from "next/link";
import type { Hexagon } from "@/data/categories";
import { localizeHexagon } from "@/data/localization";
import { toggleFavorite } from "@/lib/favorites";
import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/language";
import { playTapSound } from "@/lib/sounds";

type HexagonRowProps = {
  hexagon: Hexagon;
  language: Language;
  favorite: boolean;
};

/**
 * Una actividad en la vista lista de Explore.
 *
 * Es la otra forma de enseñar lo mismo que el panal, y existe para lo que el
 * panal hace peor: leer los nombres de corrido, comparar y encontrar rápido.
 * Por eso aquí sí cabe la descripción, que en una ficha hexagonal no entraría.
 *
 * **La estrella de favorito vive aquí y no en el panal**, a propósito. El panal
 * son diez celdas grandes para que un niño de tres años acierte el toque;
 * ponerle a cada una un segundo objetivo pequeño al lado trabaja justo en
 * contra de eso, y marcar favoritos es algo que hace el adulto. El panal sí
 * enseña cuáles lo son, pero no deja cambiarlo.
 *
 * El enlace y el botón son **hermanos**, nunca uno dentro de otro: un botón
 * dentro de un enlace no es HTML válido, y con lector de pantalla se anuncia
 * como un solo control que hace dos cosas distintas.
 */
export default function HexagonRow({
  hexagon,
  language,
  favorite,
}: HexagonRowProps) {
  const { t } = useLanguage();
  const localized = localizeHexagon(hexagon, language);
  const href =
    "href" in hexagon ? hexagon.href : `/game?hexagon=${hexagon.slug}`;

  return (
    <li className="flex items-stretch gap-2">
      <Link
        href={href}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-ink/10 bg-white px-3 py-2 text-left shadow-sm transition-transform active:scale-[0.98] sm:gap-4 sm:px-4"
      >
        {/* Decorativo: el nombre va escrito al lado. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={localized.image}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="aspect-square w-12 shrink-0 select-none sm:w-14"
        />
        <span className="min-w-0 flex-1">
          <span className="block break-words text-base font-extrabold leading-snug text-ink sm:text-lg">
            {localized.name}
          </span>
          <span className="mt-0.5 block break-words text-sm font-semibold leading-snug text-ink/60">
            {localized.description}
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={() => {
          toggleFavorite(hexagon.id);
          playTapSound();
        }}
        aria-pressed={favorite}
        aria-label={t(
          favorite ? "exploreRemoveFavoriteAria" : "exploreAddFavoriteAria",
          { name: localized.name },
        )}
        className={`flex min-h-16 w-14 shrink-0 items-center justify-center rounded-2xl border-2 text-2xl transition-transform active:scale-95 ${
          favorite
            ? "border-sun bg-sunsoft text-[#9b7600]"
            : "border-ink/10 bg-white text-ink/25"
        }`}
      >
        <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
      </button>
    </li>
  );
}
