"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import ExitDialog from "./ExitDialog";
import GameHelp from "./GameHelp";
import GameIntro, { type GameIntroContent } from "./GameIntro";
import MuteButton from "./MuteButton";
import { useLanguage } from "@/lib/i18n";
import { cancelSpeech } from "@/lib/speech";
import { EXPLORE } from "@/lib/routes";

type GameShellProps = {
  /** La explicación del juego, usada tanto por la intro como por la ayuda. */
  intro: GameIntroContent;
  /** `true` mientras el juego está en su fase de introducción. */
  showIntro: boolean;
  startLabel: string;
  onStart: () => void;
  /**
   * `true` mientras hay una partida en curso que se perdería al salir. La casa
   * pregunta entonces antes de irse. En la introducción y en los resultados no
   * hay nada que perder, así que sale directa.
   */
  confirmExit?: boolean;
  /**
   * Se llama al abrir y cerrar cualquier cosa superpuesta a la partida: la
   * ayuda y la confirmación de salida. Los juegos con reloj lo usan para
   * pausarlo y congelar sus esperas cortas: ni leer la explicación ni dudar
   * delante de la pregunta pueden costarle tiempo al jugador.
   */
  onOverlayOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

/**
 * Marco común de los juegos independientes: el `<main>`, el encabezado, la
 * pantalla de introducción y la ayuda. No tiene nada que ver con `AppShell`,
 * que es la envoltura de las rutas principales; las rutas de juego siguen sin
 * llevar barra inferior ni cabecera de la aplicación.
 *
 * El encabezado es siempre el mismo: casa que vuelve al panal a la izquierda,
 * ayuda y silencio a la derecha. La casa es el único icono de salida de los
 * juegos: lleva al panal, que es la raíz de la aplicación.
 *
 * Con una partida en curso la casa deja de ser un enlace y pasa a ser un botón
 * que pregunta, porque el toque de más de un niño no puede tirar por la borda
 * la sesión entera. Es la misma confirmación que ya protegía las lecciones
 * (`ExitDialog`), con los textos de partida.
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
  confirmExit = false,
  onOverlayOpenChange,
  children,
}: GameShellProps) {
  const { t } = useLanguage();
  const [exitOpen, setExitOpen] = useState(false);

  // Salir del juego calla cualquier explicación en curso.
  useEffect(() => () => cancelSpeech(), []);

  const openExit = useCallback(() => {
    setExitOpen(true);
    onOverlayOpenChange?.(true);
  }, [onOverlayOpenChange]);

  const closeExit = useCallback(() => {
    setExitOpen(false);
    onOverlayOpenChange?.(false);
  }, [onOverlayOpenChange]);

  // Si la partida termina detrás del diálogo, ya no hay nada que confirmar.
  // Cerrarlo aquí también reanuda lo que estuviera congelado, igual que hace
  // la ayuda cuando el juego vuelve a su introducción.
  useEffect(() => {
    if (!confirmExit && exitOpen) closeExit();
  }, [confirmExit, exitOpen, closeExit]);

  const homeClassName =
    "flex min-h-12 items-center gap-2 rounded-full border-2 border-ink/15 bg-white px-4 text-base font-extrabold text-ink shadow-sm active:scale-95";
  const homeContent = (
    <>
      <span aria-hidden="true">🏠</span>
      <span className="hidden sm:inline">{t("backToHexagons")}</span>
    </>
  );

  return (
    <main className="min-h-dvh overflow-y-auto bg-cream px-3 py-3 sm:px-6 sm:py-5">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        {/*
          El destino y la etiqueta son los mismos con partida o sin ella: lo
          que cambia es si por el camino hay una pregunta. Por eso el botón no
          se anuncia distinto, solo se comporta distinto.
        */}
        {confirmExit ? (
          <button
            type="button"
            onClick={openExit}
            aria-label={t("backToHexagons")}
            className={homeClassName}
          >
            {homeContent}
          </button>
        ) : (
          <Link
            href={EXPLORE}
            aria-label={t("backToHexagons")}
            className={homeClassName}
          >
            {homeContent}
          </Link>
        )}

        <div className="flex items-center gap-2">
          {/*
            La ayuda no aparece durante la introducción: allí la explicación ya
            es la pantalla. El borde azul la separa de la casa y del silencio,
            que son blancos.
          */}
          <GameHelp
            intro={intro}
            hidden={showIntro}
            onOpenChange={onOverlayOpenChange}
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

      <ExitDialog open={exitOpen} variant="game" onClose={closeExit} />
    </main>
  );
}
