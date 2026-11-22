"use client";

import type { QuestionOption } from "@/data/questions";
import AnswerOption, { countGlyphs, type OptionState } from "./AnswerOption";

type AnswerGridProps = {
  options: QuestionOption[];
  getState: (optionId: string) => OptionState;
  onSelect: (id: string) => void;
};

export default function AnswerGrid({
  options,
  getState,
  onSelect,
}: AnswerGridProps) {
  const twoOptions = options.length === 2;
  // En cuanto UNA opción sea un grupo, todas se pintan a la misma escala: si
  // no, en las preguntas de contar el tamaño del dibujo competiría con la
  // cantidad, que es lo único que debería distinguir una ficha de otra. Por
  // eso la escala sale del grupo MÁS grande de la pregunta: el que tiene que
  // caber en la ficha sin desbordarla.
  const mostGlyphs = options.reduce(
    (most, option) =>
      option.emoji ? Math.max(most, countGlyphs(option.emoji)) : most,
    0,
  );
  // Nunca más de dos filas —tres ya no se cuentan de un vistazo— y nunca más
  // de cuatro por fila, que es lo que cabe en una ficha de un móvil de 360px.
  const glyphColumns =
    mostGlyphs > 1
      ? mostGlyphs <= 3
        ? mostGlyphs
        : Math.min(4, Math.ceil(mostGlyphs / 2))
      : undefined;

  return (
    <div
      className={`grid w-full max-w-3xl gap-4 sm:gap-6 ${
        twoOptions ? "grid-cols-1 min-[400px]:grid-cols-2" : "grid-cols-2"
      }`}
    >
      {options.map((option) => (
        <AnswerOption
          key={option.id}
          option={option}
          state={getState(option.id)}
          onSelect={onSelect}
          glyphColumns={glyphColumns}
        />
      ))}
    </div>
  );
}
