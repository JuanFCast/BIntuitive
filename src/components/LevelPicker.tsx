"use client";

import { useId } from "react";
import { useLanguage } from "@/lib/i18n";
import type { Difficulty } from "@/lib/difficulty";

type LevelPickerProps = {
  /** Cuántos escalones tiene el juego. Lo sabe el juego, no el selector. */
  maxLevel: number;
  unlocked: Difficulty;
  selected: Difficulty;
  /** El escalón cerrado que se acaba de tocar, para explicar cómo se abre. */
  lockedHint: Difficulty | null;
  onPick: (level: Difficulty) => void;
};

/**
 * El selector de nivel de la pantalla de introducción, igual en todos los
 * juegos que usan la escala de dificultad.
 *
 * Nació dentro de Trazos y se sacó de ahí en cuanto un segundo juego lo
 * necesitó: dos copias del mismo selector acabarían explicando los candados
 * de dos maneras. Lo coloca cada juego en su introducción por la prop
 * `beforeStart` de `GameShell`, nunca dentro de `intro`, que es lo que la
 * ayuda vuelve a enseñar a mitad de partida.
 *
 * Cinco fichas en fila: las abiertas se pueden elegir y repetir cuantas veces
 * se quiera, y la elegida se distingue por color, borde y peso, no solo por
 * color —quien no distingue el amarillo tiene que verla igual—.
 *
 * Las cerradas llevan candado y se ven apagadas, pero **no** son `disabled`:
 * un botón deshabilitado no recibe foco ni toque, así que no podría explicar
 * por qué está cerrado. Llevan `aria-disabled`, no se pueden elegir, y al
 * tocarlas cuentan lo que falta para abrirlas.
 */
export default function LevelPicker({
  maxLevel,
  unlocked,
  selected,
  lockedHint,
  onPick,
}: LevelPickerProps) {
  const { t } = useLanguage();
  const labelId = useId();
  const levels = Array.from(
    { length: maxLevel },
    (_, index) => (index + 1) as Difficulty,
  );

  return (
    <div className="w-full max-w-sm">
      <p
        className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9b7400]"
        id={labelId}
      >
        {t("levelPick")}
      </p>

      <div
        className="mt-2 flex w-full items-stretch gap-2"
        role="group"
        aria-labelledby={labelId}
      >
        {levels.map((option) => {
          const locked = option > unlocked;
          const chosen = option === selected;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onPick(option)}
              aria-disabled={locked || undefined}
              aria-pressed={locked ? undefined : chosen}
              aria-label={t(
                locked
                  ? "levelLockedAria"
                  : chosen
                    ? "levelSelectedAria"
                    : "levelUnlockedAria",
                { level: option },
              )}
              className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl border-2 text-lg font-extrabold transition-transform ${
                locked
                  ? "border-ink/10 bg-ink/5 text-ink/35"
                  : chosen
                    ? "border-sun bg-sun text-black shadow-md active:scale-95"
                    : "border-ink/15 bg-white text-ink active:scale-95"
              }`}
            >
              <span aria-hidden="true">{locked ? "🔒" : option}</span>
            </button>
          );
        })}
      </div>

      {/*
        Alto mínimo fijo: el aviso aparece y desaparece sin mover el botón de
        empezar, que está justo debajo y es donde va el dedo.
      */}
      <p
        className="mt-2 flex min-h-10 items-center justify-center break-words text-center text-sm font-bold leading-snug text-ink/60"
        role="status"
        aria-live="polite"
      >
        {lockedHint
          ? t("levelLockedHint", { level: lockedHint - 1, next: lockedHint })
          : t("levelBest", { level: unlocked, total: maxLevel })}
      </p>
    </div>
  );
}
