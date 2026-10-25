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
  // cantidad, que es lo único que debería distinguir una ficha de otra.
  const anyGroup = options.some(
    (option) => option.emoji !== undefined && countGlyphs(option.emoji) > 1,
  );

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
          compact={anyGroup}
        />
      ))}
    </div>
  );
}
