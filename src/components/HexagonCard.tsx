import Link from "next/link";
import type { CSSProperties } from "react";
import type { Hexagon } from "@/data/categories";
import { localizeHexagon } from "@/data/localization";
import type { Language } from "@/lib/language";
import { HEXAGON_CLIP } from "@/lib/hexagon";

type HexagonCardProps = {
  hexagon: Hexagon;
  language: Language;
  /**
   * Si está marcado como favorito. La ficha lo **enseña** pero no lo cambia:
   * el interruptor vive en la vista lista. El panal son diez celdas grandes
   * para que un niño de tres años acierte el toque, y un segundo objetivo
   * pequeño dentro de cada una trabaja en contra de eso.
   */
  favorite?: boolean;
  /** Dónde cae la ficha: lo calcula `honeycomb.ts`, no el componente. */
  style?: CSSProperties;
};

export default function HexagonCard({
  hexagon,
  language,
  favorite = false,
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
          ? `Open the ${localizedHexagon.name} hexagon${favorite ? ", a favourite" : ""}`
          : `Abrir el hexágono ${localizedHexagon.name}${favorite ? ", favorito" : ""}`
      }
    >
      <span
        className="hexagon-face absolute inset-[2px] flex flex-col items-center justify-center px-2 text-center text-ink transition-colors duration-[--dur-ui] ease-[--ease-ui] motion-reduce:transition-none sm:px-4"
        style={{ clipPath: HEXAGON_CLIP }}
      >
        {/*
          El dibujo mide en proporción a la ficha y no a la ventana: el panal
          pasa de dos a tres y a cuatro columnas, y un tamaño atado al ancho
          de la pantalla se salía de las fichas pequeñas o se perdía en las
          grandes. Decorativo: el nombre accesible va en el enlace.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={localizedHexagon.image}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="hexagon-art aspect-square w-[46%] select-none"
        />
        <span className="hexagon-name mt-1 max-w-[86%] text-balance break-words text-[clamp(0.85rem,3.4vw,1.15rem)] font-extrabold leading-[1.05]">
          {localizedHexagon.name}
        </span>

        {/*
          La marca de favorito, arriba del todo, donde la ficha hexagonal es
          estrecha y no hay ni dibujo ni nombre. Decorativa: lo de "favorito"
          ya va dicho en el nombre accesible del enlace, y repetirlo aquí lo
          haría sonar dos veces con lector de pantalla.
        */}
        {favorite && (
          <span
            aria-hidden="true"
            className="absolute top-[7%] text-[clamp(0.7rem,2.4vw,1rem)] leading-none text-[#9b7600]"
          >
            ★
          </span>
        )}
      </span>
    </Link>
  );
}
