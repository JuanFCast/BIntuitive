"use client";

import type { QuestionOption } from "@/data/questions";

export type OptionState = "idle" | "wrong" | "correct" | "revealed" | "locked";

type AnswerOptionProps = {
  option: QuestionOption;
  state: OptionState;
  onSelect: (id: string) => void;
  /**
   * Cuántos dibujos caben por fila en esta pregunta, o `undefined` si ninguna
   * opción es un grupo y el dibujo va a tamaño grande.
   *
   * Lo decide `AnswerGrid`, que ve todas las opciones a la vez, y no cada
   * ficha por su cuenta. En "toca el grupo con más manzanas" una manzana
   * suelta se pintaba enorme y cuatro manzanas pequeñas: el tamaño decía lo
   * contrario que la cantidad, que es justo lo que hay que contar. Dentro de
   * una pregunta todos los dibujos miden igual y lo único que cambia es
   * cuántos hay.
   */
  glyphColumns?: number;
};

const stateClasses: Record<OptionState, string> = {
  idle: "bg-white border-sky/40 active:scale-95 hover:border-sky",
  // Al 80% y no al 60%: más apagada se leía como un botón roto o un castigo,
  // y el coral ya dice por sí solo "esta no era".
  wrong: "bg-coralsoft border-coral animate-shake opacity-80",
  correct: "bg-mintsoft border-mint animate-pop ring-4 ring-mint",
  revealed: "bg-mintsoft border-mint ring-4 ring-mint animate-pop",
  locked: "bg-white border-sky/30 opacity-70",
};

/**
 * Cuántos dibujos trae un emoji.
 *
 * Se cuenta por grafemas, no por caracteres: "❤️" son dos puntos de código
 * —el corazón y el selector de variante— pero un solo dibujo, y "🐶🐶" son
 * dos dibujos en cuatro unidades de código. Midiendo por `.length`, una
 * pareja de perritos se pintaba al tamaño de un dibujo suelto y llegaba a
 * salirse de la ficha.
 */
const segmenter = new Intl.Segmenter();

export function splitGlyphs(emoji: string): string[] {
  return [...segmenter.segment(emoji)].map((part) => part.segment);
}

export function countGlyphs(emoji: string): number {
  return splitGlyphs(emoji).length;
}

/**
 * Tamaño del dibujo según cuántos caben por fila.
 *
 * El tope en `cqw` es el que manda en un móvil: la ficha es el contenedor
 * (`@container`), así que el dibujo se mide contra **su** ancho y no contra la
 * ventana. Un grupo escrito como una sola cadena de texto no partía en Chrome
 * de Android y las ocho estrellas se salían de la ficha por los dos lados,
 * encima de las de al lado: contarlas era imposible. Cada dibujo ocupa ahora
 * `1.35em`, así que `100 / (1.35 · columnas)` es el tope que deja entrar
 * exactamente esos por fila, redondeado hacia abajo. Los topes en `rem` y
 * `svh` son los que mandan en tableta, donde la ficha sobra de ancho y lo que
 * escasea es el alto: dos filas tienen que caber sin desplazar.
 */
const glyphSizeByColumns: Record<number, string> = {
  1: "text-[min(5rem,13svh,37cqw)]",
  2: "text-[min(5rem,13svh,37cqw)]",
  3: "text-[min(4rem,10svh,24cqw)]",
  4: "text-[min(3.5rem,9svh,18cqw)]",
};

export default function AnswerOption({
  option,
  state,
  onSelect,
  glyphColumns,
}: AnswerOptionProps) {
  const disabled = state !== "idle";
  const isGroup = glyphColumns !== undefined;
  // La etiqueta acompaña al dibujo; cuando no hay dibujo, la etiqueta ES el
  // dibujo —el numeral de "toca el número cinco"— y se pinta en grande.
  const hasArt = Boolean(option.imageSrc ?? option.emoji);

  return (
    <button
      type="button"
      aria-label={option.alt}
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-3xl border-4 p-4 shadow-md transition-all duration-150 sm:min-h-40 ${stateClasses[state]}`}
    >
      {option.imageSrc ? (
        /*
         * Dibujo propio, no `next/image`: son SVG planos de `public/art/`,
         * que el optimizador no puede mejorar y sí podría rasterizar.
         * Decorativo, porque el nombre accesible ya lo da el `aria-label`
         * del botón; dos lecturas del mismo dibujo serían ruido.
         */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={option.imageSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          /*
           * En un iPad la ficha mide 360px de ancho y el dibujo se quedaba en
           * 112: medio tablero vacío. Crece con el alto de la pantalla y se
           * detiene en 13rem, que en una tableta apaisada con cuatro opciones
           * todavía deja caber las dos filas sin desplazar.
           */
          className="h-20 w-20 select-none sm:h-[min(13rem,22svh)] sm:w-[min(13rem,22svh)]"
        />
      ) : option.emoji ? (
        isGroup ? (
          /*
           * Un dibujo por caja, y no una cadena de texto: así la fila la parte
           * el navegador por donde se puede contar, y nunca por donde el
           * algoritmo de salto de línea le deje —que con emoji seguidos era
           * "por ningún sitio"—. Cada caja mide `1.35em`, el ancho de sobra
           * de un emoji, para que entren justo los de `glyphColumns` por fila.
           */
          <span aria-hidden="true" className="@container w-full">
            <span
              className={`flex flex-wrap items-center justify-center leading-[1.15] ${
                glyphSizeByColumns[glyphColumns] ?? glyphSizeByColumns[4]
              }`}
            >
              {splitGlyphs(option.emoji).map((glyph, index) => (
                <span
                  key={`${glyph}-${index}`}
                  className="flex w-[1.35em] justify-center"
                >
                  {glyph}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="text-6xl sm:text-8xl md:text-[min(8.5rem,15svh)]"
          >
            {option.emoji}
          </span>
        )
      ) : (
        <span aria-hidden="true" className="text-6xl font-extrabold sm:text-8xl md:text-[min(8.5rem,15svh)]">
          {option.label}
        </span>
      )}
      {hasArt && option.label && (
        <span className="text-lg font-bold text-ink/80 sm:text-2xl">
          {option.label}
        </span>
      )}
    </button>
  );
}
