"use client";

import type { QuestionOption } from "@/data/questions";

export type OptionState = "idle" | "wrong" | "correct" | "revealed" | "locked";

type AnswerOptionProps = {
  option: QuestionOption;
  state: OptionState;
  onSelect: (id: string) => void;
};

const stateClasses: Record<OptionState, string> = {
  idle: "bg-white border-sky/40 active:scale-95 hover:border-sky",
  wrong: "bg-coralsoft border-coral animate-shake opacity-60",
  correct: "bg-mintsoft border-mint animate-pop ring-4 ring-mint",
  revealed: "bg-mintsoft border-mint ring-4 ring-mint animate-pop",
  locked: "bg-white border-sky/30 opacity-70",
};

export default function AnswerOption({
  option,
  state,
  onSelect,
}: AnswerOptionProps) {
  const disabled = state !== "idle";
  const isGroup = (option.emoji ?? "").length > 4;

  return (
    <button
      type="button"
      aria-label={option.alt}
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-3xl border-4 p-4 shadow-md transition-all duration-150 sm:min-h-40 ${stateClasses[state]}`}
    >
      {option.emoji ? (
        <span
          aria-hidden="true"
          className={isGroup ? "text-3xl leading-tight sm:text-5xl" : "text-6xl sm:text-8xl"}
        >
          {option.emoji}
        </span>
      ) : (
        <span aria-hidden="true" className="text-6xl font-extrabold sm:text-8xl">
          {option.label}
        </span>
      )}
      {option.emoji && (
        <span className="text-lg font-bold text-ink/80 sm:text-2xl">
          {option.label}
        </span>
      )}
    </button>
  );
}
