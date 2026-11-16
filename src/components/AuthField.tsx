"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { FieldError } from "@/lib/authForm";

type AuthFieldProps = {
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  error: FieldError;
  autoComplete: string;
  /** El registro enfoca el campo de cada paso al llegar a él. */
  autoFocus?: boolean;
  maxLength?: number;
  /** Lo que va pegado debajo del campo y antes del error: el medidor de la contraseña. */
  children?: React.ReactNode;
};

/**
 * Un campo de los formularios de cuenta: etiqueta, casilla y error debajo.
 *
 * Todos los formularios comparten este componente para que el error se
 * anuncie igual en todos. El error va atado con `aria-describedby` y no solo
 * pintado en rojo: quien no distingue el color tiene que enterarse igual, y
 * quien usa un lector de pantalla lo oye al llegar al campo.
 *
 * Los de contraseña traen su propio botón de mostrar y ocultar. Escribir una
 * contraseña a ciegas en un teclado de teléfono es la primera causa de no
 * poder entrar, y con el botón sobra la casilla de "repetir contraseña".
 */
export default function AuthField({
  label,
  type,
  value,
  onChange,
  error,
  autoComplete,
  autoFocus = false,
  maxLength,
  children,
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
        className="block px-1 text-base font-extrabold text-ink/70"
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
          autoFocus={autoFocus}
          maxLength={maxLength}
          autoCapitalize={type === "text" ? "words" : "none"}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-14 w-full rounded-2xl border-2 bg-cream px-4 text-lg font-bold text-ink outline-none transition-colors focus:border-sun focus:bg-white ${
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

      {children}

      {error && <FieldErrorText id={errorId} error={error} />}
    </div>
  );
}

/** El error de un campo, igual en todos: icono, frase y el id que lo ata al campo. */
export function FieldErrorText({ id, error }: { id: string; error: NonNullable<FieldError> }) {
  const { t } = useLanguage();
  return (
    <p
      id={id}
      className="animate-fade-up mt-2 flex items-start gap-2 px-1 text-sm font-bold leading-snug text-[#b3402f]"
    >
      <span aria-hidden="true">⚠️</span>
      {t(error)}
    </p>
  );
}
