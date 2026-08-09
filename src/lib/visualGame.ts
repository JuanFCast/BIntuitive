import type { Language } from "./language";

export const VISUAL_ROUNDS = 10;
export const VISUAL_SYMBOLS_PER_CARD = 9;
export const VISUAL_ERROR_PENALTY_MS = 1000;

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
  { id: "bee", emoji: "🐝", label: { en: "Bee", es: "Abeja" } },
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

const POSITIONS = [
  { x: 18, y: 20 },
  { x: 50, y: 20 },
  { x: 82, y: 20 },
  { x: 18, y: 50 },
  { x: 50, y: 50 },
  { x: 82, y: 50 },
  { x: 18, y: 80 },
  { x: 50, y: 80 },
  { x: 82, y: 80 },
];

export function shuffleVisualItems<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function placeSymbols(symbols: VisualSymbol[]): PlacedVisualSymbol[] {
  return shuffleVisualItems(symbols).map((symbol, index) => ({
    ...symbol,
    x: POSITIONS[index].x + Math.round(Math.random() * 2 - 1),
    y: POSITIONS[index].y + Math.round(Math.random() * 2 - 1),
    rotation: Math.round(Math.random() * 16 - 8),
    scale: 0.94 + Math.random() * 0.12,
  }));
}

export function createFirstVisualCard(): VisualCard {
  return {
    id: 1,
    symbols: placeSymbols(
      shuffleVisualItems(VISUAL_SYMBOLS).slice(0, VISUAL_SYMBOLS_PER_CARD),
    ),
  };
}

export function createNextVisualCard(
  baseCard: VisualCard,
  id: number,
): { card: VisualCard; targetId: string } {
  const baseIds = new Set(baseCard.symbols.map((symbol) => symbol.id));
  const target =
    baseCard.symbols[Math.floor(Math.random() * baseCard.symbols.length)];
  const distractors = shuffleVisualItems(
    VISUAL_SYMBOLS.filter((symbol) => !baseIds.has(symbol.id)),
  ).slice(0, VISUAL_SYMBOLS_PER_CARD - 1);

  return {
    card: {
      id,
      symbols: placeSymbols([target, ...distractors]),
    },
    targetId: target.id,
  };
}

export function formatVisualTime(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(1)}s`;
}
