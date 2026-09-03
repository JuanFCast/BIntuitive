"use client";

import { useEffect } from "react";

/**
 * Recupera la disposición cuando el navegador devuelve una página que tenía
 * guardada en segundo plano.
 *
 * En Chrome de iPhone, salir a otra aplicación y volver por el mismo enlace no
 * carga la página otra vez: reutiliza la que ya estaba. Al restaurarla, WebKit
 * puede devolver las capas `sticky` y el tamaño del viewport tal y como
 * estaban, que ya no es lo que se ve: el encabezado aparece desplazado, la
 * barra inferior queda en un sitio que no le toca, sobra una franja de fondo y
 * el desplazamiento deja de responder. Recargar a mano lo arreglaba porque
 * rehacía la disposición desde cero.
 *
 * Esto hace solo esa parte, sin recargar: al volver a ser visible obliga al
 * navegador a rehacer la disposición y empuja el desplazamiento un píxel para
 * devolverlo enseguida. Ese ida y vuelta es lo que hace a WebKit recolocar las
 * capas pegajosas y releer el viewport.
 *
 * No toca estado de React ni de la aplicación, así que no puede reiniciar nada.
 * Aun así solo se monta en las pantallas principales —Explore, Progress y
 * Profile—, nunca sobre una partida en curso.
 */
export default function ViewportRecovery() {
  useEffect(() => {
    let frame = 0;

    const recover = () => {
      cancelAnimationFrame(frame);
      // En el siguiente fotograma: al volver del segundo plano el navegador
      // todavía está restaurando y las medidas de este instante no valen.
      frame = requestAnimationFrame(() => {
        const top = window.scrollY;
        // Lectura que fuerza rehacer la disposición antes de tocar nada.
        void document.documentElement.offsetHeight;
        window.scrollTo(0, top + 1);
        window.scrollTo(0, top);
      });
    };

    // `pageshow` cubre la restauración desde la caché de retroceso, donde no
    // llega a haber un montaje nuevo; `visibilitychange` cubre volver a la
    // pestaña desde otra aplicación, que es el caso reproducido.
    const onPageShow = () => recover();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") recover();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
