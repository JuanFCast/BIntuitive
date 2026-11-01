import type { Stars } from "./difficulty";
import type { Language } from "./language";
import { getWordLetters } from "./letters";

/**
 * Sopa de letras (Word Search). Juego independiente de Word Scramble: allí se
 * ordenan las letras de una palabra, aquí se buscan palabras escondidas en una
 * cuadrícula. Solo comparten `getWordLetters` (manejo de Unicode).
 *
 * Todo lo de este archivo es lógica pura y determinista: el generador recibe un
 * `Rng`, así que un mismo semilla produce siempre el mismo tablero y las
 * pruebas pueden reproducir cualquier caso.
 */

export const WORD_SEARCH_BOARDS_PER_SESSION = 3;
export const WORD_SEARCH_MAX_LEVEL = 5;

/**
 * Cuántas palabras recuerda el juego entre partidas para no repetirlas: dos
 * partidas de nivel 5, que esconden 27 cada una (tres tableros de nueve). Con
 * menos, las palabras de la partida en curso echarían de la lista a las de la
 * anterior antes del último tablero, y ese tablero podría repetirlas.
 */
export const WORD_SEARCH_RECENT_LIMIT = 54;

export type WordSearchLevel = 1 | 2 | 3 | 4 | 5;

/** Largo de las palabras del banco: 3 a 5, 5 a 7 y 6 a 8 letras. */
export type SearchTier = 1 | 2 | 3;

export type Cell = { row: number; col: number };

/** Paso de una celda a la siguiente al leer una palabra. */
export type Direction = { row: number; col: number };

export type SearchWord = {
  id: string;
  /** Palabra objetivo en mayúsculas y con su ortografía real, en NFC. */
  word: string;
  emoji: string;
  tier: SearchTier;
};

export type Placement = SearchWord & {
  /** Celdas exactas, en el orden en que se lee la palabra. */
  cells: Cell[];
  /** La palabra quedó colocada de derecha a izquierda o de abajo hacia arriba. */
  reversed: boolean;
};

export type Board = {
  level: WordSearchLevel;
  size: number;
  /** `grid[row][col]`: la letra visible en esa celda. */
  grid: string[][];
  placements: Placement[];
};

export type WordSearchStats = {
  boards: number;
  wordsFound: number;
  totalWords: number;
  misses: number;
  /** 0 a 1: palabras encontradas sobre el total de selecciones válidas hechas. */
  accuracy: number;
  timeMs: number;
  level: number;
};

/** Las ocho direcciones de lectura de una sopa de letras clásica. */
export const ALL_DIRECTIONS: Direction[] = [
  { row: 0, col: 1 }, // →
  { row: 1, col: 0 }, // ↓
  { row: 1, col: 1 }, // ↘
  { row: -1, col: 1 }, // ↗
  { row: 0, col: -1 }, // ←
  { row: -1, col: 0 }, // ↑
  { row: 1, col: -1 }, // ↙
  { row: -1, col: -1 }, // ↖
];

/**
 * Configuración por nivel. Los tamaños están pensados para que la cuadrícula
 * siga siendo cómoda en un móvil: 10 columnas es el máximo antes de que las
 * celdas se vuelvan diminutas.
 *
 * Del 1 al 3 son los tres niveles que el juego tenía antes de la escala de
 * cinco, idénticos: quien llegó al 3 lo encuentra abierto y con lo mismo que
 * jugaba. El 4 y el 5 no pueden crecer en tamaño, así que crecen en mecánica:
 * la lista ya no enseña la palabra escrita sino el dibujo y un hueco por letra
 * (`hideWords`), y lo que se busca es cómo se escribe lo que se ve. Por eso
 * sacan palabras de los largos 2 y 3: lo difícil ya no es lo larga que es.
 */
export const WORD_SEARCH_LEVELS: Record<
  WordSearchLevel,
  {
    size: number;
    words: number;
    directions: Direction[];
    /** Al colocar, prefiere posiciones que cruzan palabras ya puestas. */
    preferCrossings: boolean;
    /** De qué largos del banco salen sus palabras. */
    tiers: readonly SearchTier[];
    /** La lista enseña el dibujo y los huecos, no la palabra escrita. */
    hideWords: boolean;
  }
> = {
  // Solo hacia adelante: izquierda a derecha y arriba abajo.
  1: {
    size: 7,
    words: 4,
    directions: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
    preferCrossings: false,
    tiers: [1],
    hideWords: false,
  },
  // Diagonales hacia adelante y los dos inversos rectos.
  2: {
    size: 9,
    words: 6,
    directions: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: -1, col: 1 },
      { row: 0, col: -1 },
      { row: -1, col: 0 },
    ],
    preferCrossings: true,
    tiers: [2],
    hideWords: false,
  },
  // Todas las direcciones, incluidas las diagonales inversas.
  3: {
    size: 10,
    words: 7,
    directions: ALL_DIRECTIONS,
    preferCrossings: true,
    tiers: [3],
    hideWords: false,
  },
  // El tablero del 3, pero la lista solo dice qué es y cuántas letras tiene.
  4: {
    size: 10,
    words: 8,
    directions: ALL_DIRECTIONS,
    preferCrossings: true,
    tiers: [2, 3],
    hideWords: true,
  },
  5: {
    size: 10,
    words: 9,
    directions: ALL_DIRECTIONS,
    preferCrossings: true,
    tiers: [2, 3],
    hideWords: true,
  },
};

/* --------------------------------------------------------------------------
 * Azar reproducible
 * ----------------------------------------------------------------------- */

export type Rng = () => number;

/** mulberry32: pequeño, sin dependencias y suficiente para barajar y colocar. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWith<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function pickOne<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/* --------------------------------------------------------------------------
 * Banco bilingüe
 * ----------------------------------------------------------------------- */

/**
 * Banco propio de Word Search: no es el de Word Scramble ni una traducción.
 * Cada idioma tiene sus palabras, elegidas para que quepan en la cuadrícula.
 *
 * Reglas del banco:
 * - `tier` 1: 3 a 5 letras · 2: 5 a 7 · 3: 6 a 8. Es el largo de la palabra,
 *   no el escalón: cada escalón dice de qué largos saca (`tiers`).
 *   La longitud se cuenta en letras, no en bytes: "PINGÜINO" mide 8.
 * - Ortografía real: el español se escribe con `Á É Í Ó Ú Ñ Ü` cuando toca y
 *   nunca se simplifica una palabra para evitar un carácter. Todo en NFC.
 * - Del 1 al 3 el emoji solo acompaña a la palabra en la lista. En el 4 y el 5
 *   es lo único que se ve, junto al número de letras, así que tiene que ser
 *   algo que se reconozca; la palabra está en la cuadrícula para comprobarlo.
 * - Cada escalón tiene al menos dos partidas enteras de palabras de sus
 *   largos por idioma, para que una partida no repita nada de la anterior.
 */
const WORD_SEARCH_BANK: Record<Language, SearchWord[]> = {
  en: [
    { id: "en-sun", word: "SUN", emoji: "☀️", tier: 1 },
    { id: "en-cat", word: "CAT", emoji: "🐱", tier: 1 },
    { id: "en-dog", word: "DOG", emoji: "🐶", tier: 1 },
    { id: "en-bee", word: "BEE", emoji: "🐝", tier: 1 },
    { id: "en-star", word: "STAR", emoji: "⭐", tier: 1 },
    { id: "en-fish", word: "FISH", emoji: "🐟", tier: 1 },
    { id: "en-tree", word: "TREE", emoji: "🌳", tier: 1 },
    { id: "en-moon", word: "MOON", emoji: "🌙", tier: 1 },
    { id: "en-frog", word: "FROG", emoji: "🐸", tier: 1 },
    { id: "en-boat", word: "BOAT", emoji: "⛵", tier: 1 },
    { id: "en-horse", word: "HORSE", emoji: "🐴", tier: 1 },
    { id: "en-apple", word: "APPLE", emoji: "🍎", tier: 1 },
    { id: "en-cow", word: "COW", emoji: "🐄", tier: 1 },
    { id: "en-pig", word: "PIG", emoji: "🐷", tier: 1 },
    { id: "en-hat", word: "HAT", emoji: "🎩", tier: 1 },
    { id: "en-bus", word: "BUS", emoji: "🚌", tier: 1 },
    { id: "en-car", word: "CAR", emoji: "🚗", tier: 1 },
    { id: "en-egg", word: "EGG", emoji: "🥚", tier: 1 },
    { id: "en-key", word: "KEY", emoji: "🔑", tier: 1 },
    { id: "en-bed", word: "BED", emoji: "🛏️", tier: 1 },
    { id: "en-owl", word: "OWL", emoji: "🦉", tier: 1 },
    { id: "en-ant", word: "ANT", emoji: "🐜", tier: 1 },
    { id: "en-cake", word: "CAKE", emoji: "🎂", tier: 1 },
    { id: "en-milk", word: "MILK", emoji: "🥛", tier: 1 },
    { id: "en-duck", word: "DUCK", emoji: "🦆", tier: 1 },
    { id: "en-bear", word: "BEAR", emoji: "🐻", tier: 1 },
    { id: "en-lion", word: "LION", emoji: "🦁", tier: 1 },
    { id: "en-sock", word: "SOCK", emoji: "🧦", tier: 1 },
    { id: "en-kite", word: "KITE", emoji: "🪁", tier: 1 },
    { id: "en-corn", word: "CORN", emoji: "🌽", tier: 1 },
    { id: "en-house", word: "HOUSE", emoji: "🏠", tier: 2 },
    { id: "en-tiger", word: "TIGER", emoji: "🐯", tier: 2 },
    { id: "en-train", word: "TRAIN", emoji: "🚂", tier: 2 },
    { id: "en-cloud", word: "CLOUD", emoji: "☁️", tier: 2 },
    { id: "en-flower", word: "FLOWER", emoji: "🌸", tier: 2 },
    { id: "en-pencil", word: "PENCIL", emoji: "✏️", tier: 2 },
    { id: "en-rocket", word: "ROCKET", emoji: "🚀", tier: 2 },
    { id: "en-guitar", word: "GUITAR", emoji: "🎸", tier: 2 },
    { id: "en-banana", word: "BANANA", emoji: "🍌", tier: 2 },
    { id: "en-carrot", word: "CARROT", emoji: "🥕", tier: 2 },
    { id: "en-rainbow", word: "RAINBOW", emoji: "🌈", tier: 2 },
    { id: "en-dolphin", word: "DOLPHIN", emoji: "🐬", tier: 2 },
    { id: "en-zebra", word: "ZEBRA", emoji: "🦓", tier: 2 },
    { id: "en-snake", word: "SNAKE", emoji: "🐍", tier: 2 },
    { id: "en-mouse", word: "MOUSE", emoji: "🐭", tier: 2 },
    { id: "en-sheep", word: "SHEEP", emoji: "🐑", tier: 2 },
    { id: "en-clock", word: "CLOCK", emoji: "🕐", tier: 2 },
    { id: "en-pizza", word: "PIZZA", emoji: "🍕", tier: 2 },
    { id: "en-bread", word: "BREAD", emoji: "🍞", tier: 2 },
    { id: "en-grapes", word: "GRAPES", emoji: "🍇", tier: 2 },
    { id: "en-lemon", word: "LEMON", emoji: "🍋", tier: 2 },
    { id: "en-cherry", word: "CHERRY", emoji: "🍒", tier: 2 },
    { id: "en-turtle", word: "TURTLE", emoji: "🐢", tier: 2 },
    { id: "en-rabbit", word: "RABBIT", emoji: "🐰", tier: 2 },
    { id: "en-monkey", word: "MONKEY", emoji: "🐵", tier: 2 },
    { id: "en-spider", word: "SPIDER", emoji: "🕷️", tier: 2 },
    { id: "en-robot", word: "ROBOT", emoji: "🤖", tier: 2 },
    { id: "en-planet", word: "PLANET", emoji: "🪐", tier: 2 },
    { id: "en-unicorn", word: "UNICORN", emoji: "🦄", tier: 2 },
    { id: "en-ladybug", word: "LADYBUG", emoji: "🐞", tier: 2 },
    { id: "en-candle", word: "CANDLE", emoji: "🕯️", tier: 2 },
    { id: "en-camera", word: "CAMERA", emoji: "📷", tier: 2 },
    { id: "en-whale", word: "WHALE", emoji: "🐋", tier: 2 },
    { id: "en-shark", word: "SHARK", emoji: "🦈", tier: 2 },
    { id: "en-panda", word: "PANDA", emoji: "🐼", tier: 2 },
    { id: "en-snail", word: "SNAIL", emoji: "🐌", tier: 2 },
    { id: "en-castle", word: "CASTLE", emoji: "🏰", tier: 3 },
    { id: "en-giraffe", word: "GIRAFFE", emoji: "🦒", tier: 3 },
    { id: "en-balloon", word: "BALLOON", emoji: "🎈", tier: 3 },
    { id: "en-octopus", word: "OCTOPUS", emoji: "🐙", tier: 3 },
    { id: "en-pumpkin", word: "PUMPKIN", emoji: "🎃", tier: 3 },
    { id: "en-volcano", word: "VOLCANO", emoji: "🌋", tier: 3 },
    { id: "en-penguin", word: "PENGUIN", emoji: "🐧", tier: 3 },
    { id: "en-elephant", word: "ELEPHANT", emoji: "🐘", tier: 3 },
    { id: "en-mountain", word: "MOUNTAIN", emoji: "🏔️", tier: 3 },
    { id: "en-umbrella", word: "UMBRELLA", emoji: "☂️", tier: 3 },
    { id: "en-airplane", word: "AIRPLANE", emoji: "✈️", tier: 3 },
    { id: "en-dinosaur", word: "DINOSAUR", emoji: "🦕", tier: 3 },
    { id: "en-kangaroo", word: "KANGAROO", emoji: "🦘", tier: 3 },
    { id: "en-chicken", word: "CHICKEN", emoji: "🐔", tier: 3 },
    { id: "en-snowman", word: "SNOWMAN", emoji: "☃️", tier: 3 },
    { id: "en-tractor", word: "TRACTOR", emoji: "🚜", tier: 3 },
    { id: "en-bicycle", word: "BICYCLE", emoji: "🚲", tier: 3 },
    { id: "en-cupcake", word: "CUPCAKE", emoji: "🧁", tier: 3 },
    { id: "en-popcorn", word: "POPCORN", emoji: "🍿", tier: 3 },
    { id: "en-broccoli", word: "BROCCOLI", emoji: "🥦", tier: 3 },
    { id: "en-scissors", word: "SCISSORS", emoji: "✂️", tier: 3 },
    { id: "en-hedgehog", word: "HEDGEHOG", emoji: "🦔", tier: 3 },
    { id: "en-flamingo", word: "FLAMINGO", emoji: "🦩", tier: 3 },
    { id: "en-peacock", word: "PEACOCK", emoji: "🦚", tier: 3 },
    { id: "en-squirrel", word: "SQUIRREL", emoji: "🐿️", tier: 3 },
    { id: "en-gorilla", word: "GORILLA", emoji: "🦍", tier: 3 },
    { id: "en-sandwich", word: "SANDWICH", emoji: "🥪", tier: 3 },
    { id: "en-backpack", word: "BACKPACK", emoji: "🎒", tier: 3 },
    { id: "en-tomato", word: "TOMATO", emoji: "🍅", tier: 3 },
    { id: "en-parrot", word: "PARROT", emoji: "🦜", tier: 3 },
    { id: "en-turkey", word: "TURKEY", emoji: "🦃", tier: 3 },
    { id: "en-dragon", word: "DRAGON", emoji: "🐉", tier: 3 },
    { id: "en-glasses", word: "GLASSES", emoji: "👓", tier: 3 },
    { id: "en-trumpet", word: "TRUMPET", emoji: "🎺", tier: 3 },
    { id: "en-violin", word: "VIOLIN", emoji: "🎻", tier: 3 },
    { id: "en-raccoon", word: "RACCOON", emoji: "🦝", tier: 3 },
    { id: "en-lobster", word: "LOBSTER", emoji: "🦞", tier: 3 },
    { id: "en-mushroom", word: "MUSHROOM", emoji: "🍄", tier: 3 },
    { id: "en-pretzel", word: "PRETZEL", emoji: "🥨", tier: 3 },
    { id: "en-coconut", word: "COCONUT", emoji: "🥥", tier: 3 },
    { id: "en-peanut", word: "PEANUT", emoji: "🥜", tier: 3 },
    { id: "en-hamster", word: "HAMSTER", emoji: "🐹", tier: 3 },
  ],
  es: [
    { id: "es-sol", word: "SOL", emoji: "☀️", tier: 1 },
    { id: "es-pan", word: "PAN", emoji: "🍞", tier: 1 },
    { id: "es-oso", word: "OSO", emoji: "🐻", tier: 1 },
    { id: "es-luna", word: "LUNA", emoji: "🌙", tier: 1 },
    { id: "es-pato", word: "PATO", emoji: "🦆", tier: 1 },
    { id: "es-gato", word: "GATO", emoji: "🐱", tier: 1 },
    { id: "es-leon", word: "LEÓN", emoji: "🦁", tier: 1 },
    { id: "es-pina", word: "PIÑA", emoji: "🍍", tier: 1 },
    { id: "es-bebe", word: "BEBÉ", emoji: "👶", tier: 1 },
    { id: "es-fresa", word: "FRESA", emoji: "🍓", tier: 1 },
    { id: "es-globo", word: "GLOBO", emoji: "🎈", tier: 1 },
    { id: "es-nube", word: "NUBE", emoji: "☁️", tier: 1 },
    { id: "es-pez", word: "PEZ", emoji: "🐟", tier: 1 },
    { id: "es-uva", word: "UVA", emoji: "🍇", tier: 1 },
    { id: "es-ojo", word: "OJO", emoji: "👁️", tier: 1 },
    { id: "es-pie", word: "PIE", emoji: "🦶", tier: 1 },
    { id: "es-vaca", word: "VACA", emoji: "🐄", tier: 1 },
    { id: "es-rana", word: "RANA", emoji: "🐸", tier: 1 },
    { id: "es-cama", word: "CAMA", emoji: "🛏️", tier: 1 },
    { id: "es-loro", word: "LORO", emoji: "🦜", tier: 1 },
    { id: "es-bota", word: "BOTA", emoji: "👢", tier: 1 },
    { id: "es-dado", word: "DADO", emoji: "🎲", tier: 1 },
    { id: "es-rosa", word: "ROSA", emoji: "🌹", tier: 1 },
    { id: "es-mono", word: "MONO", emoji: "🐵", tier: 1 },
    { id: "es-coco", word: "COCO", emoji: "🥥", tier: 1 },
    { id: "es-tren", word: "TREN", emoji: "🚂", tier: 1 },
    { id: "es-miel", word: "MIEL", emoji: "🍯", tier: 1 },
    { id: "es-buho", word: "BÚHO", emoji: "🦉", tier: 1 },
    { id: "es-sopa", word: "SOPA", emoji: "🍲", tier: 1 },
    { id: "es-cerdo", word: "CERDO", emoji: "🐷", tier: 1 },
    { id: "es-perro", word: "PERRO", emoji: "🐶", tier: 2 },
    { id: "es-libro", word: "LIBRO", emoji: "📚", tier: 2 },
    { id: "es-queso", word: "QUESO", emoji: "🧀", tier: 2 },
    { id: "es-arbol", word: "ÁRBOL", emoji: "🌳", tier: 2 },
    { id: "es-arana", word: "ARAÑA", emoji: "🕷️", tier: 2 },
    { id: "es-conejo", word: "CONEJO", emoji: "🐰", tier: 2 },
    { id: "es-zapato", word: "ZAPATO", emoji: "👟", tier: 2 },
    { id: "es-sandia", word: "SANDÍA", emoji: "🍉", tier: 2 },
    { id: "es-jirafa", word: "JIRAFA", emoji: "🦒", tier: 2 },
    { id: "es-caballo", word: "CABALLO", emoji: "🐴", tier: 2 },
    { id: "es-tortuga", word: "TORTUGA", emoji: "🐢", tier: 2 },
    { id: "es-montana", word: "MONTAÑA", emoji: "🏔️", tier: 2 },
    { id: "es-oveja", word: "OVEJA", emoji: "🐑", tier: 2 },
    { id: "es-tigre", word: "TIGRE", emoji: "🐯", tier: 2 },
    { id: "es-cebra", word: "CEBRA", emoji: "🦓", tier: 2 },
    { id: "es-raton", word: "RATÓN", emoji: "🐭", tier: 2 },
    { id: "es-camion", word: "CAMIÓN", emoji: "🚚", tier: 2 },
    { id: "es-barco", word: "BARCO", emoji: "🚢", tier: 2 },
    { id: "es-avion", word: "AVIÓN", emoji: "✈️", tier: 2 },
    { id: "es-llave", word: "LLAVE", emoji: "🔑", tier: 2 },
    { id: "es-pelota", word: "PELOTA", emoji: "⚽", tier: 2 },
    { id: "es-limon", word: "LIMÓN", emoji: "🍋", tier: 2 },
    { id: "es-cereza", word: "CEREZA", emoji: "🍒", tier: 2 },
    { id: "es-huevo", word: "HUEVO", emoji: "🥚", tier: 2 },
    { id: "es-cohete", word: "COHETE", emoji: "🚀", tier: 2 },
    { id: "es-robot", word: "ROBOT", emoji: "🤖", tier: 2 },
    { id: "es-nieve", word: "NIEVE", emoji: "❄️", tier: 2 },
    { id: "es-dragon", word: "DRAGÓN", emoji: "🐉", tier: 2 },
    { id: "es-regalo", word: "REGALO", emoji: "🎁", tier: 2 },
    { id: "es-delfin", word: "DELFÍN", emoji: "🐬", tier: 2 },
    { id: "es-gorila", word: "GORILA", emoji: "🦍", tier: 2 },
    { id: "es-helado", word: "HELADO", emoji: "🍦", tier: 2 },
    { id: "es-pulpo", word: "PULPO", emoji: "🐙", tier: 2 },
    { id: "es-volcan", word: "VOLCÁN", emoji: "🌋", tier: 2 },
    { id: "es-panda", word: "PANDA", emoji: "🐼", tier: 2 },
    { id: "es-piano", word: "PIANO", emoji: "🎹", tier: 2 },
    { id: "es-tambor", word: "TAMBOR", emoji: "🥁", tier: 3 },
    { id: "es-corazon", word: "CORAZÓN", emoji: "❤️", tier: 3 },
    { id: "es-autobus", word: "AUTOBÚS", emoji: "🚌", tier: 3 },
    { id: "es-ventana", word: "VENTANA", emoji: "🪟", tier: 3 },
    { id: "es-manzana", word: "MANZANA", emoji: "🍎", tier: 3 },
    { id: "es-ciguena", word: "CIGÜEÑA", emoji: "🐦", tier: 3 },
    { id: "es-estrella", word: "ESTRELLA", emoji: "⭐", tier: 3 },
    { id: "es-elefante", word: "ELEFANTE", emoji: "🐘", tier: 3 },
    { id: "es-mariposa", word: "MARIPOSA", emoji: "🦋", tier: 3 },
    { id: "es-pinguino", word: "PINGÜINO", emoji: "🐧", tier: 3 },
    { id: "es-cangrejo", word: "CANGREJO", emoji: "🦀", tier: 3 },
    { id: "es-guitarra", word: "GUITARRA", emoji: "🎸", tier: 3 },
    { id: "es-gallina", word: "GALLINA", emoji: "🐔", tier: 3 },
    { id: "es-platano", word: "PLÁTANO", emoji: "🍌", tier: 3 },
    { id: "es-castillo", word: "CASTILLO", emoji: "🏰", tier: 3 },
    { id: "es-calabaza", word: "CALABAZA", emoji: "🎃", tier: 3 },
    { id: "es-canguro", word: "CANGURO", emoji: "🦘", tier: 3 },
    { id: "es-tractor", word: "TRACTOR", emoji: "🚜", tier: 3 },
    { id: "es-paraguas", word: "PARAGUAS", emoji: "☂️", tier: 3 },
    { id: "es-arcoiris", word: "ARCOÍRIS", emoji: "🌈", tier: 3 },
    { id: "es-camello", word: "CAMELLO", emoji: "🐫", tier: 3 },
    { id: "es-tiburon", word: "TIBURÓN", emoji: "🦈", tier: 3 },
    { id: "es-ballena", word: "BALLENA", emoji: "🐋", tier: 3 },
    { id: "es-hormiga", word: "HORMIGA", emoji: "🐜", tier: 3 },
    { id: "es-caracol", word: "CARACOL", emoji: "🐌", tier: 3 },
    { id: "es-telefono", word: "TELÉFONO", emoji: "📱", tier: 3 },
    { id: "es-campana", word: "CAMPANA", emoji: "🔔", tier: 3 },
    { id: "es-cebolla", word: "CEBOLLA", emoji: "🧅", tier: 3 },
    { id: "es-ardilla", word: "ARDILLA", emoji: "🐿️", tier: 3 },
    { id: "es-lagarto", word: "LAGARTO", emoji: "🦎", tier: 3 },
    { id: "es-langosta", word: "LANGOSTA", emoji: "🦞", tier: 3 },
    { id: "es-mapache", word: "MAPACHE", emoji: "🦝", tier: 3 },
    { id: "es-hamster", word: "HÁMSTER", emoji: "🐹", tier: 3 },
    { id: "es-trompeta", word: "TROMPETA", emoji: "🎺", tier: 3 },
    { id: "es-violin", word: "VIOLÍN", emoji: "🎻", tier: 3 },
    { id: "es-corona", word: "CORONA", emoji: "👑", tier: 3 },
    { id: "es-mochila", word: "MOCHILA", emoji: "🎒", tier: 3 },
    { id: "es-tomate", word: "TOMATE", emoji: "🍅", tier: 3 },
    { id: "es-flamenco", word: "FLAMENCO", emoji: "🦩", tier: 3 },
    { id: "es-brocoli", word: "BRÓCOLI", emoji: "🥦", tier: 3 },
    { id: "es-palmera", word: "PALMERA", emoji: "🌴", tier: 3 },
    { id: "es-cactus", word: "CACTUS", emoji: "🌵", tier: 3 },
  ],
};

export function getSearchBank(language: Language): SearchWord[] {
  return WORD_SEARCH_BANK[language];
}

/** Letras de una palabra objetivo: `Ñ`, `Ü` y las tildes cuentan como una. */
export function getSearchLetters(word: string): string[] {
  return getWordLetters(word);
}

/**
 * Dos palabras de la misma sopa no pueden contenerse: si estuvieran "SOL" y
 * "SOLDADO", marcar el principio de la larga daría por buena la corta y el
 * tablero se sentiría tramposo.
 */
function overlapsAsText(candidate: string, chosen: SearchWord[]): boolean {
  return chosen.some(
    (word) => word.word.includes(candidate) || candidate.includes(word.word),
  );
}

/**
 * Elige las palabras de un tablero. Prefiere las de los largos del nivel
 * (`tiers`) y las que todavía no salieron en la sesión (`excludeIds`), pero
 * nunca devuelve menos de las pedidas: si esos largos se quedan cortos, baja a
 * los vecinos y, en último caso, repite palabras de tableros anteriores.
 *
 * `recentIds` son las de partidas anteriores, de la más antigua a la más
 * reciente, y pesan menos que el largo: una reciente de un largo del nivel va
 * antes que una nueva de otro largo, y entre las recientes sale primero la
 * que lleva más tiempo sin salir.
 */
export function pickSearchWords(
  language: Language,
  level: WordSearchLevel,
  count: number,
  excludeIds: string[],
  rng: Rng = Math.random,
  recentIds: string[] = [],
): SearchWord[] {
  const { size: maxLength, tiers } = WORD_SEARCH_LEVELS[level];
  const tierDistance = (word: SearchWord) =>
    Math.min(...tiers.map((tier) => Math.abs(word.tier - tier)));
  const pool = shuffleWith(
    WORD_SEARCH_BANK[language].filter(
      (word) => getSearchLetters(word.word).length <= maxLength,
    ),
    rng,
  );

  // Orden estable: primero las no usadas, dentro de eso las de los largos del
  // nivel y dentro de ellas las que no salieron hace poco. El peso de una
  // reciente queda entre 5 y 6, por debajo del salto de largo (10).
  const recentRank = (word: SearchWord) => {
    const index = recentIds.indexOf(word.id);
    return index < 0 ? 0 : 5 + index / recentIds.length;
  };
  const rank = (word: SearchWord) =>
    (excludeIds.includes(word.id) ? 100 : 0) +
    tierDistance(word) * 10 +
    recentRank(word);
  const ordered = [...pool].sort((a, b) => rank(a) - rank(b));

  const chosen: SearchWord[] = [];
  for (const candidate of ordered) {
    if (chosen.length >= count) break;
    if (overlapsAsText(candidate.word, chosen)) continue;
    chosen.push(candidate);
  }
  return chosen;
}

/**
 * Apunta las palabras de un tablero recién generado al final de las recientes
 * y olvida las más antiguas por encima de `WORD_SEARCH_RECENT_LIMIT`.
 */
export function rememberSearchWords(
  recentIds: string[],
  ids: string[],
): string[] {
  return [...recentIds.filter((recent) => !ids.includes(recent)), ...ids].slice(
    -WORD_SEARCH_RECENT_LIMIT,
  );
}

/* --------------------------------------------------------------------------
 * Generación del tablero
 * ----------------------------------------------------------------------- */

type Candidate = {
  cells: Cell[];
  crossings: number;
  reversed: boolean;
};

/** Se lee de derecha a izquierda o de abajo hacia arriba. */
function isReversed(direction: Direction): boolean {
  return direction.col < 0 || (direction.col === 0 && direction.row < 0);
}

function emptyGrid(size: number): (string | null)[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
}

function inside(size: number, row: number, col: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

/**
 * Todas las posiciones válidas para una palabra en el tablero actual: caben
 * dentro de la cuadrícula y cada celda ocupada coincide con la letra que ya
 * había (eso es un cruce). Se descarta la posición que reescribe la palabra
 * entera sobre otra ya colocada.
 */
function collectCandidates(
  grid: (string | null)[][],
  letters: string[],
  size: number,
  directions: Direction[],
): Candidate[] {
  const candidates: Candidate[] = [];

  for (const direction of directions) {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const lastRow = row + direction.row * (letters.length - 1);
        const lastCol = col + direction.col * (letters.length - 1);
        if (!inside(size, lastRow, lastCol)) continue;

        const cells: Cell[] = [];
        let crossings = 0;
        let fits = true;

        for (let index = 0; index < letters.length; index += 1) {
          const cellRow = row + direction.row * index;
          const cellCol = col + direction.col * index;
          const existing = grid[cellRow][cellCol];
          if (existing !== null && existing !== letters[index]) {
            fits = false;
            break;
          }
          if (existing !== null) crossings += 1;
          cells.push({ row: cellRow, col: cellCol });
        }

        if (!fits || crossings === letters.length) continue;
        candidates.push({ cells, crossings, reversed: isReversed(direction) });
      }
    }
  }

  return candidates;
}

function chooseCandidate(
  candidates: Candidate[],
  rng: Rng,
  preferCrossings: boolean,
): Candidate {
  if (preferCrossings) {
    const crossing = candidates.filter((candidate) => candidate.crossings > 0);
    // No siempre: si todas las palabras se cruzaran, el tablero se apelmaza.
    if (crossing.length > 0 && rng() < 0.75) return pickOne(crossing, rng);
  }
  return pickOne(candidates, rng);
}

/** Un intento de colocar todas las palabras. `null` si alguna no cabe. */
function tryPlaceAll(
  words: SearchWord[],
  size: number,
  directions: Direction[],
  preferCrossings: boolean,
  rng: Rng,
): { grid: (string | null)[][]; placements: Placement[] } | null {
  const grid = emptyGrid(size);
  const placements: Placement[] = [];

  // Las largas primero: son las que menos sitios tienen donde caber.
  const ordered = [...words].sort(
    (a, b) =>
      getSearchLetters(b.word).length - getSearchLetters(a.word).length,
  );

  for (const word of ordered) {
    const letters = getSearchLetters(word.word);
    const candidates = collectCandidates(grid, letters, size, directions);
    if (candidates.length === 0) return null;

    const chosen = chooseCandidate(candidates, rng, preferCrossings);
    chosen.cells.forEach((cell, index) => {
      grid[cell.row][cell.col] = letters[index];
    });
    placements.push({ ...word, cells: chosen.cells, reversed: chosen.reversed });
  }

  return { grid, placements };
}

/**
 * Red de seguridad: una palabra por fila, siempre hacia adelante. Es un tablero
 * feo pero válido, y solo se usa si todos los intentos aleatorios fallaron.
 */
function fallbackPlacement(
  words: SearchWord[],
  size: number,
): { grid: (string | null)[][]; placements: Placement[] } | null {
  if (words.length > size) return null;
  const grid = emptyGrid(size);
  const placements: Placement[] = [];

  for (let index = 0; index < words.length; index += 1) {
    const letters = getSearchLetters(words[index].word);
    if (letters.length > size) return null;
    const cells = letters.map((letter, offset) => {
      grid[index][offset] = letter;
      return { row: index, col: offset };
    });
    placements.push({ ...words[index], cells, reversed: false });
  }

  return { grid, placements };
}

/**
 * Relleno de las celdas vacías. El alfabeto de relleno incluye todas las letras
 * que aparecen en las palabras del tablero: si "CIGÜEÑA" fuera la única con `Ü`
 * y `Ñ`, esas celdas cantarían la respuesta a simple vista.
 */
function buildFillerPool(language: Language, placements: Placement[]): string[] {
  const base = getWordLetters(
    language === "es"
      ? "ABCDEFGHIJLMNOPQRSTUVYZ"
      : "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  );
  const fromWords = new Set<string>();
  placements.forEach((placement) => {
    getSearchLetters(placement.word).forEach((letter) => fromWords.add(letter));
  });
  return [...base, ...fromWords, ...fromWords];
}

/** Todas las apariciones de una palabra en la cuadrícula, en las 8 direcciones. */
export function findOccurrences(grid: string[][], word: string): Cell[][] {
  const letters = getSearchLetters(word);
  const size = grid.length;
  const found: Cell[][] = [];

  for (const direction of ALL_DIRECTIONS) {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const lastRow = row + direction.row * (letters.length - 1);
        const lastCol = col + direction.col * (letters.length - 1);
        if (!inside(size, lastRow, lastCol)) continue;

        const cells: Cell[] = [];
        let matches = true;
        for (let index = 0; index < letters.length; index += 1) {
          const cellRow = row + direction.row * index;
          const cellCol = col + direction.col * index;
          if (grid[cellRow][cellCol] !== letters[index]) {
            matches = false;
            break;
          }
          cells.push({ row: cellRow, col: cellCol });
        }
        if (matches) found.push(cells);
      }
    }
  }

  return found;
}

function samePath(a: Cell[], b: Cell[]): boolean {
  if (a.length !== b.length) return false;
  const forward = a.every(
    (cell, index) => cell.row === b[index].row && cell.col === b[index].col,
  );
  if (forward) return true;
  return a.every((cell, index) => {
    const mirror = b[b.length - 1 - index];
    return cell.row === mirror.row && cell.col === mirror.col;
  });
}

/** El relleno creó una segunda aparición de una palabra objetivo. */
function hasStrayWord(grid: string[][], placements: Placement[]): boolean {
  return placements.some((placement) =>
    findOccurrences(grid, placement.word).some(
      (cells) => !samePath(cells, placement.cells),
    ),
  );
}

function fillEmptyCells(
  partial: (string | null)[][],
  pool: string[],
  rng: Rng,
): string[][] {
  return partial.map((row) =>
    row.map((cell) => cell ?? pool[Math.floor(rng() * pool.length)]),
  );
}

const MAX_LAYOUT_ATTEMPTS = 60;
const MAX_FILL_ATTEMPTS = 12;

/**
 * Genera un tablero completo y jugable:
 *
 * 1. elige las palabras de la sesión;
 * 2. las coloca de la más larga a la más corta, permitiendo cruces;
 * 3. reintenta el tablero entero si alguna no cabe (y crece la cuadrícula
 *    antes de rendirse), con una colocación de respaldo que nunca falla;
 * 4. rellena el resto con letras del alfabeto del idioma;
 * 5. rehace el relleno si creó por accidente una palabra objetivo de más.
 *
 * `placements` guarda las celdas exactas de cada palabra, que es lo que valida
 * las selecciones y lo que las pruebas comprueban contra la cuadrícula.
 */
export function generateBoard(
  language: Language,
  level: WordSearchLevel,
  rng: Rng = Math.random,
  excludeIds: string[] = [],
  recentIds: string[] = [],
): Board {
  const config = WORD_SEARCH_LEVELS[level];
  const words = pickSearchWords(
    language,
    level,
    config.words,
    excludeIds,
    rng,
    recentIds,
  );

  let layout: { grid: (string | null)[][]; placements: Placement[] } | null =
    null;
  let size = config.size;

  // Dos tamaños: el del nivel y, si de verdad no cabe, uno mayor.
  for (let grow = 0; grow <= 1 && !layout; grow += 1) {
    size = config.size + grow;
    for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt += 1) {
      layout = tryPlaceAll(
        words,
        size,
        config.directions,
        config.preferCrossings,
        rng,
      );
      if (layout) break;
    }
  }

  if (!layout) {
    size = Math.max(
      config.size,
      words.length,
      ...words.map((word) => getSearchLetters(word.word).length),
    );
    layout = fallbackPlacement(words, size);
  }

  // `fallbackPlacement` solo devuelve null si el banco violara sus propias
  // reglas de longitud; el tablero mínimo mantiene el juego en pie.
  if (!layout) {
    const grid = fillEmptyCells(
      emptyGrid(config.size),
      buildFillerPool(language, []),
      rng,
    );
    return { level, size: config.size, grid, placements: [] };
  }

  const pool = buildFillerPool(language, layout.placements);
  let grid = fillEmptyCells(layout.grid, pool, rng);
  for (
    let attempt = 0;
    attempt < MAX_FILL_ATTEMPTS && hasStrayWord(grid, layout.placements);
    attempt += 1
  ) {
    grid = fillEmptyCells(layout.grid, pool, rng);
  }

  return { level, size, grid, placements: layout.placements };
}

/* --------------------------------------------------------------------------
 * Selección
 * ----------------------------------------------------------------------- */

export function isSameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

export function cellKey(cell: Cell): string {
  return `${cell.row}-${cell.col}`;
}

/**
 * Línea recta exacta entre dos celdas: horizontal, vertical o diagonal de 45°.
 * `null` si las dos celdas no están alineadas.
 */
export function buildLine(from: Cell, to: Cell): Cell[] | null {
  const deltaRow = to.row - from.row;
  const deltaCol = to.col - from.col;
  if (deltaRow === 0 && deltaCol === 0) return [from];

  const straight =
    deltaRow === 0 ||
    deltaCol === 0 ||
    Math.abs(deltaRow) === Math.abs(deltaCol);
  if (!straight) return null;

  const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
  const stepRow = Math.sign(deltaRow);
  const stepCol = Math.sign(deltaCol);
  return Array.from({ length: steps + 1 }, (_, index) => ({
    row: from.row + stepRow * index,
    col: from.col + stepCol * index,
  }));
}

/**
 * Selección tolerante para el gesto táctil: el dedo no tiene que pasar por
 * cada celda ni terminar exactamente sobre la línea. Se proyecta el vector
 * ancla → dedo sobre las ocho direcciones, se toma la de ángulo más parecido y
 * se redondea la longitud. El resultado siempre es una línea recta válida
 * dentro del tablero.
 */
export function snapSelection(anchor: Cell, head: Cell, size: number): Cell[] {
  const deltaRow = head.row - anchor.row;
  const deltaCol = head.col - anchor.col;
  if (deltaRow === 0 && deltaCol === 0) return [anchor];

  const length = Math.hypot(deltaRow, deltaCol);
  let best: { direction: Direction; steps: number } | null = null;
  let bestCosine = -Infinity;

  for (const direction of ALL_DIRECTIONS) {
    const norm = Math.hypot(direction.row, direction.col);
    const dot = deltaRow * direction.row + deltaCol * direction.col;
    if (dot <= 0) continue;

    const cosine = dot / (norm * length);
    if (cosine > bestCosine) {
      bestCosine = cosine;
      const squared = direction.row * direction.row + direction.col * direction.col;
      best = { direction, steps: Math.max(1, Math.round(dot / squared)) };
    }
  }

  if (!best) return [anchor];
  const { direction } = best;

  // Recorta lo que se salga del tablero.
  let steps = best.steps;
  while (
    steps > 0 &&
    !inside(
      size,
      anchor.row + direction.row * steps,
      anchor.col + direction.col * steps,
    )
  ) {
    steps -= 1;
  }

  return Array.from({ length: steps + 1 }, (_, index) => ({
    row: anchor.row + direction.row * index,
    col: anchor.col + direction.col * index,
  }));
}

/** Las letras que hay realmente en esas celdas del tablero. */
export function readCells(board: Board, cells: Cell[]): string {
  return cells
    .map((cell) =>
      inside(board.size, cell.row, cell.col) ? board.grid[cell.row][cell.col] : "",
    )
    .join("");
}

/**
 * Valida una selección contra el tablero.
 *
 * Primero busca la palabra por coordenadas exactas (el camino guardado o el
 * mismo camino al revés, porque marcar de final a principio también vale). Si
 * no coincide ninguna, acepta que las letras seleccionadas deletreen una
 * palabra pendiente: el generador evita duplicados, pero si alguno se cuela el
 * jugador no debe salir perjudicado.
 *
 * Devuelve `null` para selecciones de una sola celda, para palabras ya
 * encontradas y para cualquier línea que no forme una palabra objetivo.
 */
export function findSelection(
  board: Board,
  cells: Cell[],
  foundIds: string[],
): Placement | null {
  if (cells.length < 2) return null;

  const pending = board.placements.filter(
    (placement) => !foundIds.includes(placement.id),
  );

  const byPath = pending.find((placement) => samePath(placement.cells, cells));
  if (byPath) return byPath;

  const text = readCells(board, cells);
  const backwards = readCells(board, [...cells].reverse());
  return (
    pending.find(
      (placement) => placement.word === text || placement.word === backwards,
    ) ?? null
  );
}

/* --------------------------------------------------------------------------
 * Dificultad, tiempo y estadísticas
 * ----------------------------------------------------------------------- */

/**
 * La valoración de una partida terminada, de 0 a 3, por la precisión (0 a 1):
 * palabras encontradas sobre selecciones hechas. Dos estrellas abren el
 * escalón siguiente.
 *
 * En una partida de nivel 1 hay doce palabras, así que el 0,85 de las tres
 * estrellas admite dos selecciones erradas, y el 0,65 de las dos admite seis:
 * una sopa se explora a tientas y equivocarse al marcar es parte de buscar.
 * Abandonar no llega a valorarse.
 */
export function searchSessionStars(accuracy: number): Stars {
  if (accuracy >= 0.85) return 3;
  if (accuracy >= 0.65) return 2;
  return 1;
}

export function clampSearchLevel(level: number): WordSearchLevel {
  const rounded = Math.round(level);
  if (!(rounded >= 1)) return 1;
  if (rounded >= WORD_SEARCH_MAX_LEVEL) return WORD_SEARCH_MAX_LEVEL;
  return rounded as WordSearchLevel;
}

/** Tiempo de sesión legible: "48s" hasta el minuto, "2:05" a partir de ahí. */
export function formatSearchTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function computeWordSearchStats(
  boards: number,
  wordsFound: number,
  totalWords: number,
  misses: number,
  timeMs: number,
  level: number,
): WordSearchStats {
  const attempts = wordsFound + misses;
  return {
    boards,
    wordsFound,
    totalWords,
    misses,
    accuracy: attempts === 0 ? 1 : wordsFound / attempts,
    timeMs,
    level,
  };
}
