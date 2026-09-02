"use client";

import { useCallback, useEffect, useState } from "react";
import GameIntro, { type GameIntroContent } from "./GameIntro";
import { useLanguage } from "@/lib/i18n";
import { cancelSpeech } from "@/lib/speech";

type GameHelpProps = {
  /** La misma explicación que vio el niño antes de empezar. */
  intro: GameIntroContent;
  /**
   * Oculta el botón mientras la explicación ya está en pantalla por sí sola,
   * es decir durante la introducción. Si la ayuda estaba abierta, se cierra.
   */
  hidden?: boolean;
  /** Clases del botón, para encajarlo en encabezados distintos. */
  buttonClassName?: string;
  /**
   * Se llama al abrir y al cerrar. Un juego lo usa para congelar lo que esté
   * en marcha: relojes y esperas cortas.
   */
  onOpenChange?: (open: boolean) => void;
};

/**
 * El botón de ayuda y la explicación que abre. Vive aparte de `GameShell`
 * porque las dos superficies de juego tienen encabezados distintos —los juegos
 * independientes y la ruta de preguntas— y solo comparten esto.
 *
 * La ayuda se superpone a la partida y no toca su estado: la pregunta, el
 * tablero, las letras colocadas y las estadísticas siguen exactamente igual al
 * cerrarla. Ayuda no es reiniciar.
 */
export default function GameHelp({
  intro,
  hidden = false,
  buttonClassName = "",
  onOpenChange,
}: GameHelpProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    // La explicación deja de leerse en cuanto se cierra.
    cancelSpeech();
    onOpenChange?.(false);
  }, [onOpenChange]);

  const openHelp = useCallback(() => {
    setOpen(true);
    onOpenChange?.(true);
  }, [onOpenChange]);

  // Si el juego vuelve a su introducción, la ayuda sobra: la explicación ya
  // está en pantalla. Cerrarla aquí también reanuda lo que estuviera congelado.
  useEffect(() => {
    if (hidden && open) close();
  }, [hidden, open, close]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={openHelp}
        aria-label={t("helpAria")}
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky bg-skysoft text-xl font-extrabold text-ink shadow-sm transition-transform active:scale-90 ${buttonClassName}`}
      >
        <span aria-hidden="true">?</span>
      </button>

      {open && (
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
              onAction={close}
            />
          </div>
        </div>
      )}
    </>
  );
}
