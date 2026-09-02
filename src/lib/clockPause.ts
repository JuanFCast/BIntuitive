"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pausa el reloj de un juego mientras hay algo superpuesto —hoy, la ayuda—.
 *
 * Los juegos con tiempo no guardan una duración acumulada, sino el instante en
 * que empezó la partida, y calculan lo transcurrido contra `Date.now()`. Por eso
 * pausar es desplazar ese instante hacia delante tanto como duró la pausa: al
 * reanudar, el tiempo leído es el mismo que antes de abrir la ayuda.
 *
 * Devuelve el estado de pausa, para que el juego pueda detener su intervalo y
 * rechazar entradas, y el manejador que espera `GameShell`.
 *
 * `shift` recibe los milisegundos que duró la pausa y debe sumárselos a todas
 * las marcas de inicio del juego, tanto en estado como en refs.
 */
export function useClockPause(
  shift: (pausedMs: number) => void,
): [boolean, (paused: boolean) => void] {
  const [paused, setPaused] = useState(false);
  const pausedAtRef = useRef(0);

  // El desplazamiento se lee de una ref para que el manejador sea estable y no
  // obligue a cada juego a memorizar su función.
  const shiftRef = useRef(shift);
  useEffect(() => {
    shiftRef.current = shift;
  });

  const setPausedState = useCallback((next: boolean) => {
    if (next) {
      if (!pausedAtRef.current) pausedAtRef.current = Date.now();
      setPaused(true);
      return;
    }
    if (pausedAtRef.current) {
      const pausedMs = Date.now() - pausedAtRef.current;
      pausedAtRef.current = 0;
      if (pausedMs > 0) shiftRef.current(pausedMs);
    }
    setPaused(false);
  }, []);

  return [paused, setPausedState];
}
