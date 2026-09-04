"use client";

import { useEffect } from "react";

/**
 * Fija el documento en su origen al cargar.
 *
 * El desplazamiento de una página en iOS no lo lleva el documento: lo lleva un
 * `UIScrollView` que pertenece al WebView del navegador, no a la página. Al
 * abrir el mismo enlace por segunda vez desde otra aplicación, Chrome de iPhone
 * reutiliza ese WebView y el documento es nuevo, pero la posición de ese scroll
 * no lo es. Si queda heredada, todo se dibuja corrido hacia arriba —encabezado
 * cortado, franja de fondo abajo— mientras la página cree estar en el origen,
 * porque `window.scrollY` vale 0. Medido: el layout es correcto, los rects son
 * idénticos a los de una carga sana, y hasta un elemento `position: fixed` se
 * desplaza con el resto, que es lo que delata que lo corrido es la superficie
 * entera y no ninguna capa concreta.
 *
 * El ida y vuelta de un píxel es lo que empuja una orden de desplazamiento real
 * hasta ese scroll nativo y lo devuelve a cero. Ya se intentó antes y no podía
 * funcionar: entonces el documento medía exactamente el viewport, no tenía
 * recorrido, y `scrollTo` se saturaba a 0 sin llegar a ser un desplazamiento.
 * Desde que el marco se mide contra `vh` sí hay recorrido, así que la orden
 * llega.
 *
 * Solo al cargar y al volver de la caché de retroceso. **No** al recuperar la
 * visibilidad: eso devolvería al principio a quien estuviera leyendo `/progress`
 * a media pantalla por el simple hecho de haber mirado otra aplicación.
 */
export default function ScrollAnchor() {
  useEffect(() => {
    // La posición la fija la página, no el navegador.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    const anchor = () => {
      window.scrollTo(0, 1);
      window.scrollTo(0, 0);
    };

    // Al cargar, y otra vez en el fotograma siguiente: durante el primero el
    // navegador todavía está colocando su propia interfaz.
    anchor();
    const frame = requestAnimationFrame(anchor);
    const timer = window.setTimeout(anchor, 300);

    const onPageShow = () => anchor();
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
