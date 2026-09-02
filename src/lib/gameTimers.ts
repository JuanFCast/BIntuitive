"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

type PendingTimer = {
  /** Identificador vivo, o `null` mientras el temporizador está congelado. */
  id: ReturnType<typeof setTimeout> | null;
  fn: () => void;
  /** Instante en que debe dispararse mientras corre. */
  dueAt: number;
  /** Lo que le faltaba al congelarse, o su duración si nació congelado. */
  remaining: number;
};

export type GameTimers = {
  /** Programa una espera. Si hay congelación activa, empieza al reanudar. */
  later: (fn: () => void, ms: number) => void;
  /** Descarta todo lo pendiente. */
  clear: () => void;
  /** Detiene lo pendiente conservando el tiempo que le faltaba a cada uno. */
  freeze: () => void;
  /** Vuelve a armar lo congelado con el tiempo restante exacto. */
  resume: () => void;
};

/**
 * Esperas cortas de un juego —el destello de un error, la pausa tras acertar,
 * el salto al siguiente tablero— con la posibilidad de congelarlas.
 *
 * Existe porque abrir la ayuda tiene que dejar la partida quieta: si estas
 * esperas siguieran corriendo detrás del overlay, el niño cerraría la ayuda y
 * se encontraría otra carta, otra palabra u otro tablero sin haber tocado nada.
 * Congelar guarda lo que le faltaba a cada espera y reanudar la rearma con ese
 * resto, así que la transición continúa donde estaba en vez de reiniciarse.
 *
 * `freeze` y `resume` son idempotentes: abrir y cerrar la ayuda muchas veces
 * no duplica timeouts ni adelanta ninguna transición.
 */
export function useGameTimers(): GameTimers {
  const pendingRef = useRef<PendingTimer[]>([]);
  const frozenRef = useRef(false);

  const arm = useCallback((timer: PendingTimer, ms: number) => {
    timer.dueAt = Date.now() + ms;
    timer.id = setTimeout(() => {
      timer.id = null;
      pendingRef.current = pendingRef.current.filter((item) => item !== timer);
      timer.fn();
    }, ms);
  }, []);

  const later = useCallback(
    (fn: () => void, ms: number) => {
      const timer: PendingTimer = { id: null, fn, dueAt: 0, remaining: ms };
      pendingRef.current.push(timer);
      if (!frozenRef.current) arm(timer, ms);
    },
    [arm],
  );

  const clear = useCallback(() => {
    pendingRef.current.forEach((timer) => {
      if (timer.id) clearTimeout(timer.id);
    });
    pendingRef.current = [];
  }, []);

  const freeze = useCallback(() => {
    if (frozenRef.current) return;
    frozenRef.current = true;
    const now = Date.now();
    pendingRef.current.forEach((timer) => {
      if (!timer.id) return;
      clearTimeout(timer.id);
      timer.id = null;
      timer.remaining = Math.max(0, timer.dueAt - now);
    });
  }, []);

  const resume = useCallback(() => {
    if (!frozenRef.current) return;
    frozenRef.current = false;
    // Sobre una copia: rearmar saca elementos de la lista cuando disparan.
    [...pendingRef.current].forEach((timer) => {
      if (!timer.id) arm(timer, timer.remaining);
    });
  }, [arm]);

  useEffect(() => clear, [clear]);

  return useMemo(
    () => ({ later, clear, freeze, resume }),
    [later, clear, freeze, resume],
  );
}
