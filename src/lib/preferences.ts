"use client";

import { useSyncExternalStore } from "react";
import {
  getTextSize,
  isMuted,
  subscribeToPreferences,
  type TextSize,
} from "./storage";

/**
 * Lectura reactiva de las preferencias guardadas. La fuente de verdad sigue
 * siendo `localStorage` a través de `storage.ts`; esto solo hace que un cambio
 * hecho en cualquier sitio —el menú superior, el botón de silencio de un
 * juego— se vea al instante en todos los demás, sin duplicar el estado.
 *
 * En el servidor devuelven el valor por defecto, que es el mismo que lee un
 * navegador sin nada guardado.
 */
export function useMuted(): boolean {
  return useSyncExternalStore(
    subscribeToPreferences,
    isMuted,
    () => false,
  );
}

export function useTextSize(): TextSize {
  return useSyncExternalStore(
    subscribeToPreferences,
    getTextSize,
    () => "normal" as TextSize,
  );
}
