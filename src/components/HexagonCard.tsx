import Link from "next/link";
import type { CSSProperties } from "react";
import type { Hexagon } from "@/data/categories";
import { localizeHexagon } from "@/data/localization";
import type { Language } from "@/lib/language";
import { HEXAGON_CLIP } from "@/lib/hexagon";

type HexagonCardProps = {
  hexagon: Hexagon;
  language: Language;
  /** Dónde cae la ficha: lo calcula `honeycomb.ts`, no el componente. */
  style?: CSSProperties;
};

export default function HexagonCard({
  hexagon,
  language,
  style,
}: HexagonCardProps) {
  const localizedHexagon = localizeHexagon(hexagon, language);
  const href =
    "href" in hexagon ? hexagon.href : `/game?hexagon=${hexagon.slug}`;

  return (
    <Link
      href={href}
      /*
       * La ficha exterior es del color del fondo y la interior se mete dos
       * píxeles: esa diferencia es el hueco entre celdas. Dos y no uno
       * porque con diez fichas del mismo amarillo el panal se leía como una
       * superficie continua, y lo que tiene que leerse es diez cosas que se
       * tocan.
       */
      className="hexagon-card group absolute bg-cream transition-transform duration-[--dur-press] ease-[--ease-press] hover:z-10 focus-visible:z-10 focus-visible:outline-none active:scale-[0.97] motion-reduce:transition-none"
      style={{ ...style, clipPath: HEXAGON_CLIP }}
      aria-label={
        language === "en"
          ? `Open the ${localizedHexagon.name} hexagon`
          : `Abrir el hexágono ${localizedHexagon.name}`
      }
    >
      <span
        className="hexagon-face absolute inset-[2px] flex flex-col items-center justify-center px-2 text-center text-ink transition-colors duration-[--dur-ui] ease-[--ease-ui] motion-reduce:transition-none sm:px-4"
        style={{ clipPath: HEXAGON_CLIP }}
      >
        <span
          className="hexagon-emoji text-[clamp(2rem,9vw,3.5rem)] leading-none"
          aria-hidden="true"
        >
          {localizedHexagon.emoji}
        </span>
        <span className="hexagon-name mt-1 max-w-[86%] text-balance break-words text-[clamp(0.85rem,3.4vw,1.15rem)] font-extrabold leading-[1.05]">
          {localizedHexagon.name}
        </span>
      </span>
    </Link>
  );
}
