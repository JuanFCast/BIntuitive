"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import GameHelp from "./GameHelp";
import GameIntro, { type GameIntroContent } from "./GameIntro";
import MuteButton from "./MuteButton";
import { useLanguage } from "@/lib/i18n";
import { cancelSpeech } from "@/lib/speech";

type GameShellProps = {
  /** La explicación del juego, usada tanto por la intro como por la ayuda. */
  intro: GameIntroContent;
  /** `true` mientras el juego está en su fase de introducción. */
  showIntro: boolean;
  startLabel: string;
  onStart: () => void;
  /**
   * Se llama al abrir y cerrar la ayuda. Los juegos con reloj lo usan para
   * pausarlo: leer la explicación no puede costarle tiempo al jugador.
   */
  onHelpOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

/**
 * Marco común de los juegos independientes: el `<main>`, el encabezado, la
 * pantalla de introducción y la ayuda. No tiene nada que ver con `AppShell`,
 * que es la envoltura de las rutas principales; las rutas de juego siguen sin
 * llevar barra inferior ni cabecera de la aplicación.
 *
 * El encabezado es siempre el mismo: casa que vuelve a Explore a la izquierda,
 * ayuda y silencio a la derecha. La casa es el único icono de salida de los
 * juegos: lleva a `/hexagons`, nunca a una pantalla de inicio aparte.
 *
 * La ayuda vuelve a mostrar la explicación **encima** de la partida, sin tocar
 * la máquina de fases del juego. Volver a `phase = "intro"` habría reiniciado
 * ronda, tablero, letras colocadas y estadísticas: ayuda no es reiniciar.
 */
export default function GameShell({
  intro,
  showIntro,
  startLabel,
  onStart,
  onHelpOpenChange,
  children,
}: GameShellProps) {
  const { t } = useLanguage();

  // Salir del juego calla cualquier explicación en curso.
  useEffect(() => () => cancelSpeech(), []);

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

        <div className="flex items-center gap-2">
          {/*
            La ayuda no aparece durante la introducción: allí la explicación ya
            es la pantalla. El borde azul la separa de la casa y del silencio,
            que son blancos.
          */}
          <GameHelp
            intro={intro}
            hidden={showIntro}
            onOpenChange={onHelpOpenChange}
          />
          <MuteButton />
        </div>
      </header>

      {showIntro ? (
        <GameIntro
          {...intro}
          actionLabel={startLabel}
          onAction={onStart}
        />
      ) : (
        children
      )}

    </main>
  );
}
