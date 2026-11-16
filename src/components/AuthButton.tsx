"use client";

import type { ReactNode } from "react";

type AuthButtonProps = {
  children: ReactNode;
  /** Mientras se espera a Supabase: el botón dice qué está pasando y no se pulsa dos veces. */
  busy?: boolean;
  busyLabel?: string;
  type?: "submit" | "button";
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

/**
 * El botón de los formularios de cuenta, con el canto grueso de la marca.
 *
 * Ocupado, no se desactiva del todo para el lector de pantalla: se marca con
 * `aria-busy` y su texto cambia a lo que está pasando, que es lo que se oye.
 */
export default function AuthButton({
  children,
  busy = false,
  busyLabel,
  type = "submit",
  onClick,
  variant = "primary",
  disabled = false,
}: AuthButtonProps) {
  const look =
    variant === "primary"
      ? "border-b-8 border-[#9b7600] bg-sun text-black shadow-lg active:border-b-4 disabled:border-b-4"
      : "border-2 border-b-[6px] border-ink/15 bg-white text-ink active:border-b-2";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy || disabled}
      aria-busy={busy || undefined}
      className={`mt-5 flex min-h-14 w-full items-center justify-center gap-3 break-words rounded-2xl px-5 py-3 text-xl font-extrabold leading-snug transition-transform active:scale-95 disabled:opacity-70 ${look}`}
    >
      {busy && (
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-[3px] border-black/25 border-t-black motion-reduce:animate-none"
        />
      )}
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
}
