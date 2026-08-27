import { nextLevel, shuffle } from "./gameEngine";
import type { Language } from "./language";

export const WORD_PUZZLE_WORDS_PER_SESSION = 10;
export const WORD_PUZZLE_MAX_LEVEL = 3;

/** A partir de esta cantidad de errores en una palabra, el nivel baja. */
export const WORD_PUZZLE_DROP_MISTAKES = 3;

export type WordPuzzleLevel = 1 | 2 | 3;

export type PuzzleWord = {
  id: string;
  /** Palabra objetivo en mayúsculas y con su ortografía real, en NFC. */
  word: string;
  emoji: string;
  clue: string;
  level: WordPuzzleLevel;
};

export type LetterTile = {
  /** Único por ficha: la misma letra puede repetirse en una palabra. */
  id: string;
  letter: string;
};

/** Alfabeto admitido por idioma, con la ortografía real del español. */
export const WORD_PUZZLE_ALPHABET: Record<Language, RegExp> = {
  en: /^[A-Z]+$/,
  es: /^[A-ZÁÉÍÓÚÑÜ]+$/,
};

/**
 * Separa la palabra en letras para las fichas.
 *
 * Normaliza a NFC (composición, nunca eliminación de diacríticos) porque "Á"
 * puede venir como un solo carácter o como "A" + tilde combinante; sin esto la
 * segunda forma se rompería en dos fichas. `Ñ`, `Ü` y las vocales acentuadas
 * quedan cada una como una única letra independiente.
 */
export function getWordLetters(word: string): string[] {
  return [...word.normalize("NFC")];
}

export type WordPuzzleStats = {
  solvedWords: number;
  perfectWords: number;
  mistakes: number;
  /** 0 a 1: toques correctos sobre el total de toques. */
  accuracy: number;
};

/**
 * Banco de palabras por idioma. No es una traducción: cada idioma tiene sus
 * propias palabras, elegidas para que sean cortas, concretas e ilustrables.
 *
 * Reglas del banco:
 * - Nivel 1: 3 y 4 letras · Nivel 2: 5 y 6 letras · Nivel 3: 7 y 8 letras.
 *   La longitud se cuenta en letras, no en bytes: "PINGÜINO" mide 8.
 * - Ortografía real: el español se escribe con `Á É Í Ó Ú Ñ Ü` cuando toca.
 *   Es una app educativa, así que nunca se simplifica una palabra para
 *   evitar un carácter (`ÁRBOL`, no `ARBOL`). Las palabras van en NFC.
 * - Sin palabras ambiguas: cada emoji debe sugerir una sola palabra posible.
 */
const WORD_BANK: Record<Language, PuzzleWord[]> = {
  en: [
    { id: "en-sun", word: "SUN", emoji: "☀️", clue: "It shines in the sky during the day.", level: 1 },
    { id: "en-cat", word: "CAT", emoji: "🐱", clue: "A pet that says meow.", level: 1 },
    { id: "en-dog", word: "DOG", emoji: "🐶", clue: "A pet that says woof.", level: 1 },
    { id: "en-star", word: "STAR", emoji: "⭐", clue: "It twinkles at night.", level: 1 },
    { id: "en-fish", word: "FISH", emoji: "🐟", clue: "It swims in the water.", level: 1 },
    { id: "en-tree", word: "TREE", emoji: "🌳", clue: "It is tall and full of leaves.", level: 1 },
    { id: "en-moon", word: "MOON", emoji: "🌙", clue: "It lights up the night sky.", level: 1 },
    { id: "en-cake", word: "CAKE", emoji: "🎂", clue: "You eat it on your birthday.", level: 1 },
    { id: "en-frog", word: "FROG", emoji: "🐸", clue: "A green animal that jumps.", level: 1 },
    { id: "en-milk", word: "MILK", emoji: "🥛", clue: "A white drink that comes from a cow.", level: 1 },
    { id: "en-house", word: "HOUSE", emoji: "🏠", clue: "The place where you live.", level: 2 },
    { id: "en-apple", word: "APPLE", emoji: "🍎", clue: "A red fruit that grows on a tree.", level: 2 },
    { id: "en-tiger", word: "TIGER", emoji: "🐯", clue: "A big cat with orange stripes.", level: 2 },
    { id: "en-train", word: "TRAIN", emoji: "🚂", clue: "It travels on rails.", level: 2 },
    { id: "en-flower", word: "FLOWER", emoji: "🌸", clue: "It grows in a garden and smells nice.", level: 2 },
    { id: "en-pencil", word: "PENCIL", emoji: "✏️", clue: "You use it to write and draw.", level: 2 },
    { id: "en-rocket", word: "ROCKET", emoji: "🚀", clue: "It flies into space.", level: 2 },
    { id: "en-guitar", word: "GUITAR", emoji: "🎸", clue: "An instrument with six strings.", level: 2 },
    { id: "en-banana", word: "BANANA", emoji: "🍌", clue: "A long yellow fruit.", level: 2 },
    { id: "en-carrot", word: "CARROT", emoji: "🥕", clue: "An orange vegetable that rabbits love.", level: 2 },
    { id: "en-rainbow", word: "RAINBOW", emoji: "🌈", clue: "Colors in the sky after the rain.", level: 3 },
    { id: "en-penguin", word: "PENGUIN", emoji: "🐧", clue: "A black and white bird that cannot fly.", level: 3 },
    { id: "en-dolphin", word: "DOLPHIN", emoji: "🐬", clue: "A clever animal that lives in the sea.", level: 3 },
    { id: "en-balloon", word: "BALLOON", emoji: "🎈", clue: "It floats when you fill it with air.", level: 3 },
    { id: "en-giraffe", word: "GIRAFFE", emoji: "🦒", clue: "The animal with the longest neck.", level: 3 },
    { id: "en-elephant", word: "ELEPHANT", emoji: "🐘", clue: "A huge grey animal with a trunk.", level: 3 },
    { id: "en-mountain", word: "MOUNTAIN", emoji: "🏔️", clue: "A very high place with snow on top.", level: 3 },
    { id: "en-umbrella", word: "UMBRELLA", emoji: "☂️", clue: "It keeps you dry in the rain.", level: 3 },
    { id: "en-airplane", word: "AIRPLANE", emoji: "✈️", clue: "It carries people through the sky.", level: 3 },
    { id: "en-sandwich", word: "SANDWICH", emoji: "🥪", clue: "Bread with something tasty inside.", level: 3 },
  ],
  es: [
    { id: "es-sol", word: "SOL", emoji: "☀️", clue: "Brilla en el cielo durante el día.", level: 1 },
    { id: "es-pan", word: "PAN", emoji: "🍞", clue: "Se come en el desayuno.", level: 1 },
    { id: "es-oso", word: "OSO", emoji: "🐻", clue: "Animal grande que vive en el bosque.", level: 1 },
    { id: "es-luna", word: "LUNA", emoji: "🌙", clue: "Ilumina el cielo de noche.", level: 1 },
    { id: "es-pato", word: "PATO", emoji: "🦆", clue: "Nada en el lago y hace cuac.", level: 1 },
    { id: "es-casa", word: "CASA", emoji: "🏠", clue: "El lugar donde vives.", level: 1 },
    { id: "es-gato", word: "GATO", emoji: "🐱", clue: "Mascota que hace miau.", level: 1 },
    { id: "es-leon", word: "LEÓN", emoji: "🦁", clue: "Tiene melena y es el rey de la selva.", level: 1 },
    { id: "es-pina", word: "PIÑA", emoji: "🍍", clue: "Fruta amarilla con corona de hojas.", level: 1 },
    { id: "es-bebe", word: "BEBÉ", emoji: "👶", clue: "Persona muy pequeña que todavía no camina.", level: 1 },
    { id: "es-perro", word: "PERRO", emoji: "🐶", clue: "Mascota que hace guau.", level: 2 },
    { id: "es-libro", word: "LIBRO", emoji: "📚", clue: "Tiene páginas para leer.", level: 2 },
    { id: "es-globo", word: "GLOBO", emoji: "🎈", clue: "Flota cuando lo llenas de aire.", level: 2 },
    { id: "es-queso", word: "QUESO", emoji: "🧀", clue: "Comida amarilla que sale de la leche.", level: 2 },
    { id: "es-fresa", word: "FRESA", emoji: "🍓", clue: "Fruta roja, pequeña y dulce.", level: 2 },
    { id: "es-conejo", word: "CONEJO", emoji: "🐰", clue: "Animal de orejas largas que salta.", level: 2 },
    { id: "es-zapato", word: "ZAPATO", emoji: "👟", clue: "Se pone en el pie.", level: 2 },
    { id: "es-arbol", word: "ÁRBOL", emoji: "🌳", clue: "Planta muy alta con tronco y muchas hojas.", level: 2 },
    { id: "es-arana", word: "ARAÑA", emoji: "🕷️", clue: "Tiene ocho patas y teje una tela.", level: 2 },
    { id: "es-sandia", word: "SANDÍA", emoji: "🍉", clue: "Fruta verde por fuera y roja por dentro.", level: 2 },
    { id: "es-manzana", word: "MANZANA", emoji: "🍎", clue: "Fruta roja que crece en el árbol.", level: 3 },
    { id: "es-caballo", word: "CABALLO", emoji: "🐴", clue: "Animal grande que corre y se monta.", level: 3 },
    { id: "es-tortuga", word: "TORTUGA", emoji: "🐢", clue: "Camina despacio y carga su caparazón.", level: 3 },
    { id: "es-montana", word: "MONTAÑA", emoji: "🏔️", clue: "Lugar muy alto con nieve en la punta.", level: 3 },
    { id: "es-corazon", word: "CORAZÓN", emoji: "❤️", clue: "Late dentro de tu pecho.", level: 3 },
    { id: "es-autobus", word: "AUTOBÚS", emoji: "🚌", clue: "Vehículo grande que lleva muchas personas.", level: 3 },
    { id: "es-estrella", word: "ESTRELLA", emoji: "⭐", clue: "Brilla en el cielo de noche.", level: 3 },
    { id: "es-elefante", word: "ELEFANTE", emoji: "🐘", clue: "Animal enorme con trompa larga.", level: 3 },
    { id: "es-mariposa", word: "MARIPOSA", emoji: "🦋", clue: "Vuela y tiene alas de colores.", level: 3 },
    { id: "es-pinguino", word: "PINGÜINO", emoji: "🐧", clue: "Ave blanca y negra que no vuela.", level: 3 },
  ],
};

export function getWordBank(language: Language): PuzzleWord[] {
  return WORD_BANK[language];
}

/**
 * Elige la siguiente palabra del idioma actual, prefiriendo el nivel pedido y
 * cayendo al nivel más cercano cuando ya no quedan palabras sin usar.
 * `usedIds` acumula las palabras ya jugadas, así que ninguna se repite dentro
 * de una misma partida. Sigue el mismo criterio de selección que usa
 * `pickNextQuestion` en el motor de lecciones, aplicado a palabras.
 */
export function pickNextWord(
  language: Language,
  level: number,
  usedIds: string[],
): PuzzleWord | null {
  const available = WORD_BANK[language].filter(
    (candidate) => !usedIds.includes(candidate.id),
  );
  if (available.length === 0) return null;

  const sorted = [...available].sort(
    (a, b) => Math.abs(a.level - level) - Math.abs(b.level - level),
  );
  const bestDistance = Math.abs(sorted[0].level - level);
  const candidates = sorted.filter(
    (candidate) => Math.abs(candidate.level - level) === bestDistance,
  );
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Desordena las letras de la palabra. Cada ficha guarda su posición original
 * en el id para que las letras repetidas sigan siendo fichas distintas.
 */
export function createLetterTiles(word: string): LetterTile[] {
  const letters = getWordLetters(word);
  const solution = letters.join("");
  const tiles = letters.map((letter, index) => ({
    id: `${index}-${letter}`,
    letter,
  }));

  // Evita entregar la palabra ya resuelta; se rinde si todas las letras son iguales.
  let shuffled = shuffle(tiles);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (shuffled.map((tile) => tile.letter).join("") !== solution) break;
    shuffled = shuffle(tiles);
  }
  return shuffled;
}

/**
 * Dificultad suave. Reutiliza `nextLevel` del motor de lecciones para el ±1 y
 * el tope, pero la decisión se toma por palabra:
 * - 2 palabras seguidas sin errores suben el nivel (máximo 3).
 * - Una palabra con muchos errores baja el nivel (mínimo 1).
 * - Entre medias el nivel se mantiene y la racha se reinicia.
 */
export function nextWordPuzzleLevel(
  level: number,
  streak: number,
  mistakes: number,
): { level: number; streak: number } {
  if (mistakes >= WORD_PUZZLE_DROP_MISTAKES) {
    return nextLevel(level, streak, true);
  }
  if (mistakes > 0) {
    return { level, streak: 0 };
  }
  return nextLevel(level, streak, false);
}

export function computeWordPuzzleStats(
  solvedWords: number,
  perfectWords: number,
  correctTaps: number,
  mistakes: number,
): WordPuzzleStats {
  const totalTaps = correctTaps + mistakes;
  return {
    solvedWords,
    perfectWords,
    mistakes,
    accuracy: totalTaps === 0 ? 1 : correctTaps / totalTaps,
  };
}
