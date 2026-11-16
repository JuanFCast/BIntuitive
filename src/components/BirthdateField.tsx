"use client";

import { useId, useRef } from "react";
import { useLanguage } from "@/lib/i18n";
import type { BirthdateParts, FieldError } from "@/lib/authForm";
import { FieldErrorText } from "./AuthField";

type BirthdateFieldProps = {
  value: BirthdateParts;
  onChange: (value: BirthdateParts) => void;
  error: FieldError;
  autoFocus?: boolean;
};

type Part = keyof BirthdateParts;

const LENGTH: Record<Part, number> = { day: 2, month: 2, year: 4 };

/**
 * La fecha de nacimiento en tres casillas de números: día, mes y año.
 *
 * No es un `<input type="date">`: en el escritorio cada navegador lo pinta a
 * su manera, y en el teléfono abre un calendario que empieza en el mes de hoy,
 * así que llegar a 1990 son cuatrocientos toques. Tres casillas con teclado
 * numérico se rellenan en seis pulsaciones y saltan solas a la siguiente.
 *
 * El orden sigue al idioma —mes, día y año en inglés; día, mes y año en
 * español— porque es como cada cual escribe su fecha sin pensarlo, y un
 * 04/05 leído al revés es otra persona.
 */
export default function BirthdateField({
  value,
  onChange,
  error,
  autoFocus = false,
}: BirthdateFieldProps) {
  const { t, language } = useLanguage();
  const id = useId();
  const errorId = `${id}-error`;
  const refs = useRef<Partial<Record<Part, HTMLInputElement | null>>>({});

  const order: Part[] =
    language === "en" ? ["month", "day", "year"] : ["day", "month", "year"];
  const labels: Record<Part, string> = {
    day: t("authDay"),
    month: t("authMonth"),
    year: t("authYear"),
  };
  const placeholders: Record<Part, string> = {
    day: "DD",
    month: "MM",
    year: language === "en" ? "YYYY" : "AAAA",
  };

  const update = (part: Part, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, LENGTH[part]);
    onChange({ ...value, [part]: digits });

    // Lleno, salta a la casilla siguiente: nadie tiene que tocar la pantalla
    // entre el día y el mes.
    const next = order[order.indexOf(part) + 1];
    if (digits.length === LENGTH[part] && next) refs.current[next]?.focus();
  };

  const back = (part: Part, event: React.KeyboardEvent<HTMLInputElement>) => {
    // Borrar en una casilla vacía vuelve a la anterior, como en un código.
    if (event.key !== "Backspace" || value[part]) return;
    const previous = order[order.indexOf(part) - 1];
    if (previous) refs.current[previous]?.focus();
  };

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="px-1 text-base font-extrabold text-ink/70">
        {t("authBirthdate")}
      </legend>

      <div className="mt-2 grid grid-cols-[1fr_1fr_1.5fr] gap-3">
        {order.map((part, index) => (
          <label key={part} className="block">
            <span className="sr-only">{labels[part]}</span>
            <input
              ref={(node) => {
                refs.current[part] = node;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={`bday-${part}`}
              autoFocus={autoFocus && index === 0}
              value={value[part]}
              placeholder={placeholders[part]}
              onChange={(event) => update(part, event.target.value)}
              onKeyDown={(event) => back(part, event)}
              aria-invalid={error ? true : undefined}
              className={`min-h-16 w-full rounded-2xl border-2 bg-cream px-2 text-center text-2xl font-extrabold tabular-nums text-ink outline-none transition-colors placeholder:text-ink/25 focus:border-sun focus:bg-white ${
                error ? "border-coral" : "border-ink/15"
              }`}
            />
            <span
              aria-hidden="true"
              className="mt-1 block text-center text-sm font-bold text-ink/70"
            >
              {labels[part]}
            </span>
          </label>
        ))}
      </div>

      {error && <FieldErrorText id={errorId} error={error} />}
    </fieldset>
  );
}
