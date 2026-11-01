import { clampDifficulty, type Stars } from "./difficulty";
import type { Language } from "./language";

export const VISUAL_ROUNDS = 10;
export const VISUAL_ERROR_PENALTY_MS = 1000;

/** Cuántos símbolos lleva una carta en el escalón que era el único que había. */
export const VISUAL_SYMBOLS_PER_CARD = 9;

export const VISUAL_MAX_LEVEL = 5;

export type VisualLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Recorta al rango de este juego. `storage.ts` guarda el escalón tal cual
 * —hasta el tope de la escala compartida, que es 5— y cuántos tiene Agilidad
 * visual lo sabe solo este archivo, así que el número no se escribe dos veces.
 */
export function clampVisualLevel(value: unknown): VisualLevel {
  const level = clampDifficulty(value);
  return Math.min(level, VISUAL_MAX_LEVEL) as VisualLevel;
}

/**
 * Qué cambia en cada escalón.
 *
 * Las rondas son diez en todos: lo que se entrena es el barrido de la vista,
 * no la resistencia, y una sesión más larga no la hace más difícil. Crece por
 * dos vías, y en este orden a propósito:
 *
 * - **Cuántos símbolos hay que mirar.** Cuatro se abarcan de un vistazo; doce
 *   obligan a recorrer la carta.
 * - **Cuánto se parecen entre sí dos presentaciones del mismo símbolo.** En el
 *   primer escalón todos van rectos y del mismo tamaño, así que el mismo
 *   objeto se ve igual en las dos cartas y basta reconocer el dibujo. Girado y
 *   reescalado ya no basta: hay que reconocer la forma, no la imagen.
 *
 * Por eso el cuarto repite las nueve del tercero y solo aumenta el giro: es el
 * escalón que separa "buscar un dibujo" de "buscar una forma", y mezclarlo con
 * un salto de cantidad lo haría pasar inadvertido.
 */
export const VISUAL_LEVELS: Record<
  VisualLevel,
  {
    symbols: number;
    /** Giro máximo en grados, a un lado o al otro. 0 = todo recto. */
    rotation: number;
    /** Cuánto puede encogerse o crecer un símbolo. 0 = todos iguales. */
    scale: number;
  }
> = {
  1: { symbols: 4, rotation: 0, scale: 0 },
  2: { symbols: 6, rotation: 8, scale: 0.06 },
  3: { symbols: 9, rotation: 8, scale: 0.06 },
  4: { symbols: 9, rotation: 25, scale: 0.18 },
  5: { symbols: 12, rotation: 25, scale: 0.18 },
};

/**
 * Precisión de la sesión, de 0 a 100: rondas acertadas sobre toques totales.
 *
 * Vive aquí y no en el componente porque es la cifra que se guarda y la que
 * decide las estrellas, y esas dos cosas no pueden salir de dos cuentas.
 */
export function visualAccuracy(mistakes: number): number {
  return Math.round(
    (VISUAL_ROUNDS / Math.max(VISUAL_ROUNDS + mistakes, 1)) * 100,
  );
}

/**
 * La valoración de la sesión, de cero a tres.
 *
 * Mismos cortes que Parejas, y por la misma razón: la precisión es lo único
 * comparable entre escalones —el tiempo no lo es, doce símbolos se barren más
 * despacio que cuatro—. Con diez rondas, tres estrellas es como mucho un
 * fallo, y dos estrellas como mucho tres.
 *
 * Cero es para la sesión que no llegó al final, y esa no se guarda.
 */
export function visualSessionStars(
  accuracy: number,
  completed: boolean,
): Stars {
  if (!completed) return 0;
  if (accuracy >= 90) return 3;
  if (accuracy >= 75) return 2;
  return 1;
}

export type VisualSymbol = {
  id: string;
  emoji: string;
  label: Record<Language, string>;
};

export type PlacedVisualSymbol = VisualSymbol & {
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

export type VisualCard = {
  id: number;
  symbols: PlacedVisualSymbol[];
};

export const VISUAL_SYMBOLS: VisualSymbol[] = [
  { id: "sun", emoji: "☀️", label: { en: "Sun", es: "Sol" } },
  { id: "moon", emoji: "🌙", label: { en: "Moon", es: "Luna" } },
  { id: "star", emoji: "⭐", label: { en: "Star", es: "Estrella" } },
  { id: "bolt", emoji: "⚡", label: { en: "Lightning", es: "Rayo" } },
  { id: "flower", emoji: "🌸", label: { en: "Flower", es: "Flor" } },
  { id: "fire", emoji: "🔥", label: { en: "Fire", es: "Fuego" } },
  { id: "drop", emoji: "💧", label: { en: "Water drop", es: "Gota" } },
  { id: "rainbow", emoji: "🌈", label: { en: "Rainbow", es: "Arcoíris" } },
  { id: "cactus", emoji: "🌵", label: { en: "Cactus", es: "Cactus" } },
  { id: "apple", emoji: "🍎", label: { en: "Apple", es: "Manzana" } },
  { id: "strawberry", emoji: "🍓", label: { en: "Strawberry", es: "Fresa" } },
  { id: "carrot", emoji: "🥕", label: { en: "Carrot", es: "Zanahoria" } },
  { id: "pizza", emoji: "🍕", label: { en: "Pizza", es: "Pizza" } },
  { id: "banana", emoji: "🍌", label: { en: "Banana", es: "Banano" } },
  { id: "avocado", emoji: "🥑", label: { en: "Avocado", es: "Aguacate" } },
  { id: "grapes", emoji: "🍇", label: { en: "Grapes", es: "Uvas" } },
  { id: "crab", emoji: "🦀", label: { en: "Crab", es: "Cangrejo" } },
  { id: "cat", emoji: "🐱", label: { en: "Cat", es: "Gato" } },
  { id: "ladybug", emoji: "🐞", label: { en: "Ladybug", es: "Mariquita" } },
  { id: "frog", emoji: "🐸", label: { en: "Frog", es: "Rana" } },
  { id: "turtle", emoji: "🐢", label: { en: "Turtle", es: "Tortuga" } },
  { id: "butterfly", emoji: "🦋", label: { en: "Butterfly", es: "Mariposa" } },
  { id: "whale", emoji: "🐳", label: { en: "Whale", es: "Ballena" } },
  { id: "dog", emoji: "🐶", label: { en: "Dog", es: "Perro" } },
  { id: "penguin", emoji: "🐧", label: { en: "Penguin", es: "Pingüino" } },
  { id: "car", emoji: "🚗", label: { en: "Car", es: "Carro" } },
  { id: "bike", emoji: "🚲", label: { en: "Bicycle", es: "Bicicleta" } },
  { id: "rocket", emoji: "🚀", label: { en: "Rocket", es: "Cohete" } },
  { id: "ball", emoji: "⚽", label: { en: "Ball", es: "Balón" } },
  { id: "balloon", emoji: "🎈", label: { en: "Balloon", es: "Globo" } },
  { id: "gift", emoji: "🎁", label: { en: "Gift", es: "Regalo" } },
  { id: "key", emoji: "🔑", label: { en: "Key", es: "Llave" } },
  { id: "bell", emoji: "🔔", label: { en: "Bell", es: "Campana" } },
  { id: "bulb", emoji: "💡", label: { en: "Light bulb", es: "Bombillo" } },
  { id: "anchor", emoji: "⚓", label: { en: "Anchor", es: "Ancla" } },
  { id: "guitar", emoji: "🎸", label: { en: "Guitar", es: "Guitarra" } },
  { id: "dice", emoji: "🎲", label: { en: "Dice", es: "Dado" } },
  { id: "palette", emoji: "🎨", label: { en: "Palette", es: "Paleta" } },
  { id: "book", emoji: "📚", label: { en: "Books", es: "Libros" } },
  { id: "clock", emoji: "⏰", label: { en: "Clock", es: "Reloj" } },
  { id: "pencil", emoji: "✏️", label: { en: "Pencil", es: "Lápiz" } },
  { id: "globe", emoji: "🌍", label: { en: "Globe", es: "Mundo" } },
];

/**
 * Dónde se coloca cada símbolo, por cuántos haya en la carta.
 *
 * Una rejilla escrita por cantidad y no una sola de nueve recortada: con
 * cuatro símbolos, las cuatro primeras casillas de una rejilla de 3×3 los
 * dejarían apelotonados arriba a la izquierda y media carta vacía. La carta es
 * más ancha que alta (3/2 en móvil, 4/3 desde tableta), así que las doce van
 * en cuatro columnas por tres filas y no al contrario.
 */
const POSITIONS: Record<number, { x: number; y: number }[]> = {
  4: [
    { x: 30, y: 30 },
    { x: 70, y: 30 },
    { x: 30, y: 70 },
    { x: 70, y: 70 },
  ],
  6: [
    { x: 20, y: 32 },
    { x: 50, y: 32 },
    { x: 80, y: 32 },
    { x: 20, y: 68 },
    { x: 50, y: 68 },
    { x: 80, y: 68 },
  ],
  9: [
    { x: 18, y: 20 },
    { x: 50, y: 20 },
    { x: 82, y: 20 },
    { x: 18, y: 50 },
    { x: 50, y: 50 },
    { x: 82, y: 50 },
    { x: 18, y: 80 },
    { x: 50, y: 80 },
    { x: 82, y: 80 },
  ],
  12: [
    { x: 15, y: 22 },
    { x: 38, y: 22 },
    { x: 62, y: 22 },
    { x: 85, y: 22 },
    { x: 15, y: 50 },
    { x: 38, y: 50 },
    { x: 62, y: 50 },
    { x: 85, y: 50 },
    { x: 15, y: 78 },
    { x: 38, y: 78 },
    { x: 62, y: 78 },
    { x: 85, y: 78 },
  ],
};

/** Las cantidades de símbolos para las que hay rejilla escrita. */
export const VISUAL_CARD_SIZES = Object.keys(POSITIONS).map(Number);

export function shuffleVisualItems<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function placeSymbols(
  symbols: VisualSymbol[],
  level: VisualLevel,
): PlacedVisualSymbol[] {
  const { rotation, scale } = VISUAL_LEVELS[level];
  const grid = POSITIONS[symbols.length];

  return shuffleVisualItems(symbols).map((symbol, index) => ({
    ...symbol,
    x: grid[index].x + Math.round(Math.random() * 2 - 1),
    y: grid[index].y + Math.round(Math.random() * 2 - 1),
    // Con `rotation: 0` y `scale: 0` sale todo recto y del mismo tamaño, que es
    // justo lo que hace reconocible el primer escalón: el mismo dibujo se ve
    // igual en las dos cartas.
    rotation: Math.round(Math.random() * rotation * 2 - rotation),
    scale: 1 - scale + Math.random() * scale * 2,
  }));
}

export function createFirstVisualCard(level: VisualLevel): VisualCard {
  return {
    id: 1,
    symbols: placeSymbols(
      shuffleVisualItems(VISUAL_SYMBOLS).slice(0, VISUAL_LEVELS[level].symbols),
      level,
    ),
  };
}

export function createNextVisualCard(
  baseCard: VisualCard,
  id: number,
  level: VisualLevel,
): { card: VisualCard; targetId: string } {
  const baseIds = new Set(baseCard.symbols.map((symbol) => symbol.id));
  const target =
    baseCard.symbols[Math.floor(Math.random() * baseCard.symbols.length)];
  const distractors = shuffleVisualItems(
    VISUAL_SYMBOLS.filter((symbol) => !baseIds.has(symbol.id)),
  ).slice(0, VISUAL_LEVELS[level].symbols - 1);

  return {
    card: {
      id,
      symbols: placeSymbols([target, ...distractors], level),
    },
    targetId: target.id,
  };
}

export function formatVisualTime(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(1)}s`;
}
