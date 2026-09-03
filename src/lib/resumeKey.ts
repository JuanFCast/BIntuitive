"use client";

import { useEffect, useState } from "react";

/**
 * Un número que cambia cada vez que la página vuelve del segundo plano.
 *
 * Sirve para dar una `key` nueva a lo que haya que reconstruir al reanudar.
 * En Chrome de iPhone, volver por el mismo enlace no carga la página otra vez:
 * devuelve la que estaba guardada, y con ella las capas de composición que
 * WebKit tenía hechas para los elementos `sticky`. Esas capas quedan colocadas
 * contra un viewport que ya no existe, y rehacer la disposición no basta para
 * que se reconstruyan: hacen falta nodos nuevos.
 *
 * Solo cuenta como reanudación de verdad:
 * - `pageshow` con `persisted`, que es una restauración desde la caché de
 *   retroceso —la carga inicial también dispara `pageshow`, y ahí no hay nada
 *   que recuperar—;
 * - pasar a visible, que solo ocurre si antes se estuvo oculto.
 */
export function useResumeKey(): number {
  const [resumeKey, setResumeKey] = useState(0);

  useEffect(() => {
    const bump = () => setResumeKey((current) => current + 1);

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) bump();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") bump();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return resumeKey;
}
