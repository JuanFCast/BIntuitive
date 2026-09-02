"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import MuteButton from "./MuteButton";
import { useLanguage } from "@/lib/i18n";

/**
 * Marco común de los juegos independientes: el `<main>` y el encabezado que
 * antes cada juego repetía por su cuenta. No tiene nada que ver con `AppShell`,
 * que es la envoltura de las rutas principales; las rutas de juego siguen sin
 * llevar barra inferior ni cabecera de la aplicación.
 *
 * El encabezado es siempre el mismo: casa que vuelve a Explore a la izquierda y
 * silencio a la derecha. La casa es el único icono de salida de los juegos:
 * lleva a `/hexagons`, nunca a una pantalla de inicio aparte.
 */
export default function GameShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();

  return (
    <main className="min-h-dvh overflow-y-auto bg-cream px-3 py-3 sm:px-6 sm:py-5">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link
          href="/hexagons"
          aria-label={t("backToHexagons")}
          className="flex min-h-12 items-center gap-2 rounded-full border-2 border-ink/15 bg-white px-4 text-base font-extrabold text-ink shadow-sm active:scale-95"
        >
          <span aria-hidden="true">🏠</span>
          <span className="hidden sm:inline">{t("backToHexagons")}</span>
        </Link>
        <MuteButton />
      </header>

      {children}
    </main>
  );
}
