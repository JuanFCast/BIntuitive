import type { Stars } from "./difficulty";
import type { Language } from "./language";

/**
 * Parejas: lógica pura del juego de memoria.
 *
 * El banco es suyo y no lo comparte con Agilidad visual, igual que los dos
 * juegos de palabras tienen el suyo. Aquí los emojis tienen que ser distintos
 * entre sí de un vistazo: dos parecidos convierten el juego en un examen de
 * vista en vez de uno de memoria.
 */

export const MEMORY_MAX_LEVEL = 5;

export type MemoryLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Qué cambia en cada escalón: cuántas parejas, en cuántas columnas y cuánto se
 * queda destapada una pareja fallida antes de volver a taparse.
 *
 * Ocho parejas como máximo, y en cuatro columnas: dieciséis fichas en 4×4
 * caben en un teléfono de 360 px sin desplazar la página y con fichas de unos
 * 78 px. Veinte fichas no se han comprobado y no se ofrecen. Por eso el quinto
 * escalón no añade fichas: se hace más difícil acortando el destape, que es
 * memoria pura.
 *
 * Las columnas van por escalón porque el número de fichas no siempre reparte
 * bien en tres: ocho fichas son dos filas de cuatro, no dos filas y dos tercios.
 */
export const MEMORY_LEVELS: Record<
  MemoryLevel,
  { pairs: number; columns: 3 | 4; flipBackMs: number }
> = {
  1: { pairs: 3, columns: 3, flipBackMs: 1400 },
  2: { pairs: 4, columns: 4, flipBackMs: 1200 },
  3: { pairs: 6, columns: 3, flipBackMs: 1000 },
  4: { pairs: 8, columns: 4, flipBackMs: 850 },
  5: { pairs: 8, columns: 4, flipBackMs: 700 },
};

/** El tablero más grande de todos: el banco tiene que poder llenarlo. */
export const MEMORY_MAX_PAIRS = Math.max(
  ...Object.values(MEMORY_LEVELS).map((level) => level.pairs),
);

export function clampMemoryLevel(level: number): MemoryLevel {
  const rounded = Math.round(level);
  if (rounded <= 1) return 1;
  if (rounded >= MEMORY_MAX_LEVEL) return MEMORY_MAX_LEVEL;
  return rounded as MemoryLevel;
}

/**
 * La valoración de una partida, de cero a tres estrellas, por la precisión.
 *
 * Sin terminar vale cero: no hay partida que valorar y abandonar no puede
 * abrir nada. Terminada, una estrella es haberla acabado; dos, acertar al
 * menos seis de cada diez intentos; tres, ocho de cada diez.
 */
export function memorySessionStars(accuracy: number, completed: boolean): Stars {
  if (!completed) return 0;
  if (accuracy >= 80) return 3;
  if (accuracy >= 60) return 2;
  return 1;
}

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
 * Un tablero nuevo: tantos símbolos al azar del banco como parejas pida el
 * escalón, cada uno dos veces y todo revuelto. Cada partida trae símbolos
 * distintos, así que repetir no es repasar el mismo tablero.
 */
export function createMemoryBoard(pairs: number): MemoryCard[] {
  const chosen = shuffleMemoryItems(MEMORY_SYMBOLS).slice(0, pairs);

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
