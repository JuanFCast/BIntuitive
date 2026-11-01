"use client";

import { useSyncExternalStore } from "react";
import type { Hexagon } from "@/data/categories";

/**
 * Los hexágonos marcados como favoritos en este dispositivo.
 *
 * Clave propia, como el idioma, el sonido, el tamaño de texto y el perfil: no
 * son progreso educativo y `clearProgress()` no puede llevárselos por delante
 * —quien borra su progreso no pide dejar de tener sus juegos a mano—, y
 * tampoco son una preferencia de la aplicación que se edite en el menú.
 *
 * Se guardan **ids**, no posiciones ni nombres: el panal se reordena y los
 * nombres se traducen, pero el id de un hexágono es lo único estable. Un id
 * que ya no exista se descarta al leer, así que retirar una actividad no deja
 * un favorito fantasma.
 *
 * El día que haya cuentas, esto es lo que se sincroniza por perfil infantil.
 * Mientras tanto vive aquí, igual que el resto.
 */
const FAVORITES_KEY = "bintuitive-favorites";

type HexagonId = Hexagon["id"];

const listeners = new Set<() => void>();

/** Se recalcula al escribir, para que `useSyncExternalStore` compare bien. */
let snapshot: readonly HexagonId[] = [];
let snapshotRaw: string | null = null;

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeToFavorites(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function read(): readonly HexagonId[] {
  if (typeof window === "undefined") return [];

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(FAVORITES_KEY);
  } catch {
    return [];
  }

  /*
   * `useSyncExternalStore` compara la referencia, así que leer y construir un
   * array nuevo en cada render provocaría un bucle infinito de renders. Se
   * cachea contra el texto guardado: mientras no cambie, se devuelve el mismo.
   */
  if (raw === snapshotRaw) return snapshot;

  snapshotRaw = raw;
  snapshot = parse(raw);
  return snapshot;
}

function parse(raw: string | null): readonly HexagonId[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is HexagonId => typeof value === "string",
    );
  } catch {
    return [];
  }
}

export function getFavorites(): readonly HexagonId[] {
  return read();
}

export function isFavorite(id: HexagonId): boolean {
  return read().includes(id);
}

export function toggleFavorite(id: HexagonId): void {
  const current = read();
  const next = current.includes(id)
    ? current.filter((value) => value !== id)
    : [...current, id];

  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    // Sin almacenamiento el favorito no sobrevive a la recarga, pero la
    // pantalla sí tiene que reaccionar: se actualiza igualmente.
  }

  snapshotRaw = JSON.stringify(next);
  snapshot = next;
  notify();
}

const EMPTY: readonly HexagonId[] = [];

/**
 * Lectura reactiva. En el servidor devuelve la lista vacía, que es lo mismo
 * que ve un navegador sin nada guardado: así el primer render coincide y no
 * hay desajuste de hidratación.
 */
export function useFavorites(): readonly HexagonId[] {
  return useSyncExternalStore(subscribeToFavorites, read, () => EMPTY);
}
