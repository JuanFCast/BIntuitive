"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Lo que puede recibir foco dentro de un panel. */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento de teclado de un panel que se anuncia como modal.
 *
 * Decir `aria-modal="true"` es prometer que, mientras está abierto, no hay nada
 * más con lo que interactuar. Sin atrapar el foco esa promesa es falsa: el
 * tabulador se escapa hacia los controles de detrás, que el usuario de teclado
 * no ve tapados. Aquí el foco entra al panel al abrir, da la vuelta en los
 * extremos y regresa a donde estaba al cerrar.
 *
 * Lo usan el menú de ajustes y los diálogos de confirmación. Es el mismo
 * problema en los dos sitios, así que vive una sola vez.
 */
export function useFocusTrap(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onEscape: () => void,
): void {
  // La salida se lee de una ref para que el manejador no se vuelva a suscribir
  // cada vez que el componente padre crea una función nueva.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      previouslyFocused?.focus();
    };
  }, [open, panelRef]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const outside = !active || !panel.contains(active);
      // Recién abierto el foco está en el propio panel: desde ahí Tab entra por
      // el primero y Mayús+Tab por el último.
      const atPanel = active === panel;

      if (event.shiftKey) {
        if (outside || atPanel || active === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (outside || atPanel || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, panelRef]);
}
