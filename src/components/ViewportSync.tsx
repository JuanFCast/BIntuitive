"use client";

import { useEffect } from "react";

const SETTLE_DELAYS = [0, 180, 700] as const;

/**
 * Resincroniza el scroll nativo que Chrome/iOS conserva al abrir de nuevo un
 * enlace desde otra aplicación.
 *
 * En el fallo, el documento es nuevo y sus medidas son correctas, pero el
 * UIScrollView del navegador sigue desplazado: todo el lienzo aparece más
 * arriba, aunque `window.scrollY` diga 0. Una orden de scroll real lo corrige,
 * pero una página que mide exactamente el viewport no tiene recorrido y
 * WebKit descarta esa orden.
 *
 * Para que la orden llegue al scroll nativo, se añade al final un espaciador
 * invisible de dos píxeles, se avanza un píxel, se vuelve a la posición
 * lógica original y se retira el espaciador. No queda altura extra ni cambia
 * el estado de React. Los reintentos cubren el tiempo durante el que Chrome
 * termina de colocar sus barras; se cancelan en cuanto el usuario interactúa.
 */
export default function ViewportSync() {
  useEffect(() => {
    let disposed = false;
    let interactionVersion = 0;
    const timers = new Set<number>();
    const frames = new Set<number>();
    const spacers = new Set<HTMLDivElement>();

    const removeSpacer = (spacer: HTMLDivElement | null) => {
      if (!spacer) return;
      spacer.remove();
      spacers.delete(spacer);
    };

    const nextFrame = (callback: () => void) => {
      const frame = requestAnimationFrame(() => {
        frames.delete(frame);
        callback();
      });
      frames.add(frame);
    };

    const syncNativeScroll = () => {
      if (disposed || document.visibilityState !== "visible") return;

      const scrollingElement = document.scrollingElement;
      if (!scrollingElement) return;

      const originalTop = Math.max(0, window.scrollY);
      const interactionAtStart = interactionVersion;
      let spacer: HTMLDivElement | null = null;

      if (scrollingElement.scrollHeight <= scrollingElement.clientHeight) {
        spacer = document.createElement("div");
        spacer.setAttribute("aria-hidden", "true");
        spacer.style.cssText =
          "height:2px;width:1px;pointer-events:none;overflow-anchor:none";
        document.body.appendChild(spacer);
        spacers.add(spacer);

        // WebKit debe materializar el recorrido antes de recibir scrollTo.
        void scrollingElement.scrollHeight;
      }

      const maxTop =
        scrollingElement.scrollHeight - scrollingElement.clientHeight;
      const probeTop =
        originalTop < maxTop
          ? originalTop + 1
          : originalTop > 0
            ? originalTop - 1
            : null;

      if (probeTop === null) {
        removeSpacer(spacer);
        return;
      }

      window.scrollTo(0, probeTop);

      // Dos fotogramas evitan que WebKit fusione el avance y el regreso en una
      // sola orden. Si el usuario toca la página entre ambos, su gesto gana.
      nextFrame(() => {
        if (disposed || interactionVersion !== interactionAtStart) {
          removeSpacer(spacer);
          return;
        }

        window.scrollTo(0, originalTop);
        nextFrame(() => removeSpacer(spacer));
      });
    };

    const clearTimers = () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    };

    const scheduleSync = () => {
      clearTimers();
      for (const delay of SETTLE_DELAYS) {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          syncNativeScroll();
        }, delay);
        timers.add(timer);
      }
    };

    const onInteraction = () => {
      interactionVersion += 1;
      clearTimers();
    };
    const onPageShow = () => scheduleSync();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") scheduleSync();
      else clearTimers();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pointerdown", onInteraction, { passive: true });
    window.addEventListener("touchstart", onInteraction, { passive: true });
    window.addEventListener("wheel", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);

    scheduleSync();

    return () => {
      disposed = true;
      clearTimers();
      for (const frame of frames) cancelAnimationFrame(frame);
      for (const spacer of spacers) spacer.remove();
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("wheel", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
  }, []);

  return null;
}
