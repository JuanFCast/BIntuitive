import type { Language } from "./language";

/**
 * Parejas: lógica pura del juego de memoria.
 *
 * El tablero es vertical —tres columnas— porque el juego se juega de pie y con
 * una mano en un teléfono, no en la mesa. Tres columnas por cuatro filas son
 * doce fichas: seis parejas, que es una partida corta de verdad y cabe entera
 * en la pantalla sin desplazarla.
 *
 * El banco es suyo y no lo comparte con Agilidad visual, igual que los dos
 * juegos de palabras tienen el suyo. Aquí los emojis tienen que ser distintos
 * entre sí de un vistazo: dos parecidos convierten el juego en un examen de
 * vista en vez de uno de memoria.
 */

export const MEMORY_PAIRS = 6;
export const MEMORY_COLUMNS = 3;

/** Lo que una pareja fallida se queda destapada antes de volver a taparse. */
export const MEMORY_FLIP_BACK_MS = 1000;

/** Pausa tras acertar, para que se vea la pareja antes de darla por hecha. */
export const MEMORY_MATCH_MS = 450;

export type MemorySymbol = {
  id: string;
  emoji: string;
  label: Record<Language, string>;
};

/**
 * Una ficha del tablero. `key` la identifica a ella —hay dos por símbolo— y
 * `symbolId` dice de qué pareja es.
 */
export type MemoryCard = {
  key: string;
  symbol: MemorySymbol;
};

export const MEMORY_SYMBOLS: MemorySymbol[] = [
  { id: "apple", emoji: "🍎", label: { en: "Apple", es: "Manzana" } },
  { id: "banana", emoji: "🍌", label: { en: "Banana", es: "Banano" } },
  { id: "strawberry", emoji: "🍓", label: { en: "Strawberry", es: "Fresa" } },
  { id: "grapes", emoji: "🍇", label: { en: "Grapes", es: "Uvas" } },
  { id: "dog", emoji: "🐶", label: { en: "Dog", es: "Perro" } },
  { id: "cat", emoji: "🐱", label: { en: "Cat", es: "Gato" } },
  { id: "turtle", emoji: "🐢", label: { en: "Turtle", es: "Tortuga" } },
  { id: "butterfly", emoji: "🦋", label: { en: "Butterfly", es: "Mariposa" } },
  { id: "penguin", emoji: "🐧", label: { en: "Penguin", es: "Pingüino" } },
  { id: "sunflower", emoji: "🌻", label: { en: "Sunflower", es: "Girasol" } },
  { id: "tree", emoji: "🌳", label: { en: "Tree", es: "Árbol" } },
  { id: "car", emoji: "🚗", label: { en: "Car", es: "Carro" } },
  { id: "rocket", emoji: "🚀", label: { en: "Rocket", es: "Cohete" } },
  { id: "ball", emoji: "⚽", label: { en: "Ball", es: "Balón" } },
  { id: "balloon", emoji: "🎈", label: { en: "Balloon", es: "Globo" } },
  { id: "gift", emoji: "🎁", label: { en: "Gift", es: "Regalo" } },
  { id: "drum", emoji: "🥁", label: { en: "Drum", es: "Tambor" } },
  { id: "umbrella", emoji: "☂️", label: { en: "Umbrella", es: "Paraguas" } },
];

export function shuffleMemoryItems<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * Un tablero nuevo: seis símbolos al azar del banco, cada uno dos veces y todo
 * revuelto. Cada partida trae símbolos distintos, así que repetir no es repasar
 * el mismo tablero.
 */
export function createMemoryBoard(): MemoryCard[] {
  const chosen = shuffleMemoryItems(MEMORY_SYMBOLS).slice(0, MEMORY_PAIRS);

  return shuffleMemoryItems(
    chosen.flatMap((symbol) => [
      { key: `${symbol.id}-a`, symbol },
      { key: `${symbol.id}-b`, symbol },
    ]),
  );
}

/**
 * Cuántos de los intentos fueron pareja. Sin intentos aún es 100: la partida
 * empieza perfecta y se estropea sola, no al revés.
 */
export function memoryAccuracy(moves: number, matched: number): number {
  if (moves === 0) return 100;
  return Math.round((matched / moves) * 100);
}

/** `m:ss`, que es como se lee una partida que puede pasar del minuto. */
export function formatMemoryTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");
  return `${Math.floor(totalSeconds / 60)}:${seconds}`;
}
