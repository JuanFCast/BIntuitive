"use client";

import { useSyncExternalStore } from "react";

/**
 * Cómo se enseña Explore: el panal o la lista.
 *
 * Tiene clave propia y **no** está en `storage.ts` junto al idioma, el sonido y
 * el tamaño de texto, aunque también se recuerde en el dispositivo. Aquellas
 * son preferencias de toda la aplicación y por eso se editan en un único sitio,
 * el menú de la cabecera; esta es el estado de **una pantalla**, se cambia en
 * esa misma pantalla y no significa nada fuera de ella. Meterla en el menú
 * obligaría a ir a buscarla a otro sitio para cambiar lo que se está mirando.
 *
 * El panal es el valor por defecto, y a propósito: es la identidad de
 * BIntuitive y lo primero que tiene que ver quien abre la aplicación. La lista
 * está para encontrar rápido, que es una necesidad del adulto más que del niño.
 */
const VIEW_KEY = "bintuitive-explore-view";

export type ExploreView = "honeycomb" | "list";

const listeners = new Set<() => void>();

export function subscribeToExploreView(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function getExploreView(): ExploreView {
  if (typeof window === "undefined") return "honeycomb";
  try {
    return window.localStorage.getItem(VIEW_KEY) === "list"
      ? "list"
      : "honeycomb";
  } catch {
    return "honeycomb";
  }
}

export function setExploreView(view: ExploreView): void {
  try {
    window.localStorage.setItem(VIEW_KEY, view);
  } catch {
    // Sin almacenamiento la elección dura lo que dure la sesión.
  }
  for (const listener of listeners) listener();
}

/**
 * En el servidor devuelve el panal, que es lo mismo que ve un navegador sin
 * nada guardado: así el primer render coincide y no hay salto al hidratar.
 */
export function useExploreView(): ExploreView {
  return useSyncExternalStore(
    subscribeToExploreView,
    getExploreView,
    () => "honeycomb" as ExploreView,
  );
}
