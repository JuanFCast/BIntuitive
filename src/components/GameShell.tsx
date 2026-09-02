"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import GameIntro, {
  type ActionVariant,
  type GameIntroContent,
} from "./GameIntro";
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
  actionVariant?: ActionVariant;
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
  actionVariant,
  onHelpOpenChange,
  children,
}: GameShellProps) {
  const { t } = useLanguage();
  const [helpOpen, setHelpOpen] = useState(false);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    // La explicación deja de leerse en cuanto se cierra.
    cancelSpeech();
    onHelpOpenChange?.(false);
  }, [onHelpOpenChange]);

  const openHelp = useCallback(() => {
    setHelpOpen(true);
    onHelpOpenChange?.(true);
  }, [onHelpOpenChange]);

  // La ayuda se cierra sola si el juego vuelve a su introducción: la
  // explicación ya está en pantalla y dejarla duplicada no tendría sentido.
  useEffect(() => {
    if (showIntro && helpOpen) closeHelp();
  }, [showIntro, helpOpen, closeHelp]);

  useEffect(() => {
    if (!helpOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeHelp();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen, closeHelp]);

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
          {!showIntro && (
            <button
              type="button"
              onClick={openHelp}
              aria-label={t("helpAria")}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky bg-skysoft text-xl font-extrabold text-ink shadow-sm transition-transform active:scale-90"
            >
              <span aria-hidden="true">?</span>
            </button>
          )}
          <MuteButton />
        </div>
      </header>

      {showIntro ? (
        <GameIntro
          {...intro}
          actionLabel={startLabel}
          onAction={onStart}
          actionVariant={actionVariant}
        />
      ) : (
        children
      )}

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={intro.title}
        >
          <div className="my-auto w-full max-w-md rounded-3xl border-4 border-sky bg-cream p-5 shadow-2xl sm:p-6">
            <GameIntro
              {...intro}
              layout="dialog"
              actionLabel={t("helpClose")}
              onAction={closeHelp}
            />
          </div>
        </div>
      )}
    </main>
  );
}
