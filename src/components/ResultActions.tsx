"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

/**
 * El par de botones con el que termina cualquier actividad: repetir y volver a
 * Explore.
 *
 * Las siete superficies acaban igual, así que los botones se definen una vez.
 * Lo que cambia es la etiqueta de repetir, que cada juego escribe a su manera;
 * la salida es siempre la misma y siempre lleva a `/hexagons`.
 *
 * El secundario es blanco con borde de tinta, como la casa del encabezado: en
 * esta aplicación "salir" se ve así en todas partes.
 */
export default function ResultActions({
  playAgainLabel,
  onPlayAgain,
}: {
  playAgainLabel: string;
  onPlayAgain: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={onPlayAgain}
        className="min-h-14 flex-1 break-words rounded-2xl border-b-8 border-[#9b7600] bg-sun px-4 py-3 text-xl font-extrabold leading-snug text-black shadow-lg transition-transform active:scale-95 active:border-b-4 sm:px-6"
      >
        {playAgainLabel}
      </button>
      <Link
        href="/hexagons"
        className="flex min-h-14 flex-1 items-center justify-center break-words rounded-2xl border-b-8 border-ink/15 bg-white px-4 py-3 text-center text-xl font-extrabold leading-snug text-ink shadow-lg transition-transform active:scale-95 active:border-b-4 sm:px-6"
      >
        {t("backToHexagons")}
      </Link>
    </div>
  );
}
