"use client";

import type { QuestionOption } from "@/data/questions";

export type OptionState = "idle" | "wrong" | "correct" | "revealed" | "locked";

type AnswerOptionProps = {
  option: QuestionOption;
  state: OptionState;
  onSelect: (id: string) => void;
  /**
   * Pinta el emoji en pequeño aunque esta opción traiga uno solo.
   *
   * Lo decide `AnswerGrid`, que ve todas las opciones a la vez, y no cada
   * ficha por su cuenta. En "toca el grupo con más manzanas" una manzana
   * suelta se pintaba enorme y cuatro manzanas pequeñas: el tamaño decía lo
   * contrario que la cantidad, que es justo lo que hay que contar. Dentro de
   * una pregunta todos los dibujos miden igual y lo único que cambia es
   * cuántos hay.
   */
  compact?: boolean;
};

const stateClasses: Record<OptionState, string> = {
  idle: "bg-white border-sky/40 active:scale-95 hover:border-sky",
  wrong: "bg-coralsoft border-coral animate-shake opacity-60",
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

export function countGlyphs(emoji: string): number {
  return [...segmenter.segment(emoji)].length;
}

export default function AnswerOption({
  option,
  state,
  onSelect,
  compact = false,
}: AnswerOptionProps) {
  const disabled = state !== "idle";
  const isGroup =
    compact || (option.emoji ? countGlyphs(option.emoji) > 1 : false);
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
          className="h-20 w-20 select-none sm:h-28 sm:w-28"
        />
      ) : option.emoji ? (
        <span
          aria-hidden="true"
          className={
            isGroup
              ? "text-3xl leading-tight sm:text-5xl"
              : "text-6xl sm:text-8xl"
          }
        >
          {option.emoji}
        </span>
      ) : (
        <span aria-hidden="true" className="text-6xl font-extrabold sm:text-8xl">
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
