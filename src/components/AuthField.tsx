"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { FieldError } from "@/lib/authForm";

type AuthFieldProps = {
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  error: FieldError;
  autoComplete: string;
};

/**
 * Un campo de los formularios de cuenta: etiqueta, casilla y error debajo.
 *
 * Los tres formularios comparten este componente para que el error se anuncie
 * igual en todos. El error va atado con `aria-describedby` y no solo pintado
 * en rojo: quien no distingue el color tiene que enterarse igual, y quien usa
 * un lector de pantalla lo oye al llegar al campo.
 *
 * Los de contraseña traen su propio botón de mostrar y ocultar. Escribir una
 * contraseña a ciegas en un teclado de teléfono es la primera causa de no
 * poder entrar, y el botón es parte del campo, no un extra.
 */
export default function AuthField({
  label,
  type,
  value,
  onChange,
  error,
  autoComplete,
}: AuthFieldProps) {
  const { t } = useLanguage();
  const id = useId();
  const errorId = `${id}-error`;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mt-4 first:mt-0">
      <label
        htmlFor={id}
        className="block px-1 text-sm font-extrabold uppercase tracking-[0.14em] text-ink/45"
      >
        {label}
      </label>

      {/*
        Revelada, la casilla pasa a `text`. El valor de reserva no puede ser el
        `type` recibido: en un campo de contraseña ese valor es justamente
        "password", así que el botón cambiaba de etiqueta sin enseñar nada.
      */}
      <div className="relative mt-2">
        <input
          id={id}
          type={isPassword ? (revealed ? "text" : "password") : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-14 w-full rounded-2xl border-2 bg-cream px-4 text-lg font-bold text-ink outline-none transition-colors focus:border-sun ${
            isPassword ? "pr-16" : ""
          } ${error ? "border-coral" : "border-ink/15"}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={t(revealed ? "authHidePassword" : "authShowPassword")}
            aria-pressed={revealed}
            className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl text-xl transition-transform active:scale-90"
          >
            <span aria-hidden="true">{revealed ? "🙈" : "👁️"}</span>
          </button>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          className="mt-2 flex items-start gap-2 px-1 text-sm font-bold leading-snug text-[#b3402f]"
        >
          <span aria-hidden="true">⚠️</span>
          {t(error)}
        </p>
      )}
    </div>
  );
}
