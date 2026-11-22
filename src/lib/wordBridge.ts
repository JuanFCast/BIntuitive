import type { Stars } from "./difficulty";
import type { Language } from "./language";

/**
 * Puente de palabras: lógica pura del juego de traducción entre inglés y
 * español. Es el juego de BIntuitive Plus.
 *
 * Se practica **el idioma contrario al de la interfaz**: quien usa la
 * aplicación en español practica inglés y al revés. Así sirve a los dos
 * públicos sin un ajuste más que entender, y "tu idioma" es siempre el que ya
 * se lee en todos los botones.
 *
 * El banco es suyo y no comparte nada con Word Scramble, la sopa ni Parejas:
 * aquí cada entrada **es** una pareja de idiomas, y en los otros cada idioma
 * tiene su lista sin correspondencia.
 */

export const WORD_BRIDGE_MAX_LEVEL = 5;

export type WordBridgeLevel = 1 | 2 | 3 | 4 | 5;

/** Cómo se juega un escalón. Cambia la mecánica, no el tamaño. */
export type WordBridgeMode = "match" | "listen" | "sentence";

/**
 * Lo que agrupa el banco por dificultad de la palabra, no por escalón:
 * 1 y 2 son cosas que se pueden dibujar (y llevan su dibujo), 3 son verbos y
 * adjetivos, que no se dibujan bien y por eso no llevan.
 */
export type WordBridgeTier = 1 | 2 | 3;

type MatchLevel = {
  mode: "match";
  tiers: WordBridgeTier[];
  /** Parejas por tablero. */
  pairs: number;
  /** Si la palabra de tu idioma lleva su dibujo al lado. */
  pictures: boolean;
  /** Tableros por sesión. */
  rounds: number;
};

type ListenLevel = {
  mode: "listen";
  tiers: WordBridgeTier[];
  /** Respuestas para elegir. */
  options: number;
  rounds: number;
};

type SentenceLevel = {
  mode: "sentence";
  /** Palabras de más, que no van en la frase. */
  decoys: number;
  rounds: number;
};

export type WordBridgeLevelConfig = MatchLevel | ListenLevel | SentenceLevel;

/**
 * Los cinco escalones. Del 1 al 3 se unen parejas y lo que cambia es la ayuda
 * —con dibujo, más parejas, y luego sin dibujo y con verbos—; el 4 deja de
 * enseñar la palabra y hay que **oírla**; el 5 pasa de palabras a frases.
 *
 * Seis parejas como máximo: son dos columnas de seis botones, que es lo que
 * cabe en un teléfono de 360 px sin desplazar la página.
 */
export const WORD_BRIDGE_LEVELS: Record<WordBridgeLevel, WordBridgeLevelConfig> = {
  1: { mode: "match", tiers: [1], pairs: 4, pictures: true, rounds: 3 },
  2: { mode: "match", tiers: [1, 2], pairs: 6, pictures: true, rounds: 3 },
  3: { mode: "match", tiers: [2, 3], pairs: 6, pictures: false, rounds: 3 },
  4: { mode: "listen", tiers: [1, 2, 3], options: 4, rounds: 10 },
  5: { mode: "sentence", decoys: 2, rounds: 6 },
};

export function clampWordBridgeLevel(level: number): WordBridgeLevel {
  const rounded = Math.round(level);
  if (rounded <= 1) return 1;
  if (rounded >= WORD_BRIDGE_MAX_LEVEL) return WORD_BRIDGE_MAX_LEVEL;
  return rounded as WordBridgeLevel;
}

/** El idioma que se practica: el contrario al de la interfaz. */
export function targetLanguage(interfaceLanguage: Language): Language {
  return interfaceLanguage === "en" ? "es" : "en";
}

/**
 * La valoración de una sesión por la precisión: aciertos entre intentos.
 *
 * Los umbrales son más altos que en Parejas porque aquí no hay que recordar
 * dónde estaba nada: todo está a la vista y se falla por no saber, no por no
 * acordarse. Sin terminar vale cero.
 */
export function wordBridgeSessionStars(accuracy: number, completed: boolean): Stars {
  if (!completed) return 0;
  if (accuracy >= 85) return 3;
  if (accuracy >= 65) return 2;
  return 1;
}

/** Aciertos entre intentos. Sin intentos es 100: se empieza perfecto. */
export function wordBridgeAccuracy(attempts: number, hits: number): number {
  if (attempts === 0) return 100;
  return Math.round((hits / attempts) * 100);
}

/** Pausa tras acertar una pareja, para verla unida antes de seguir. */
export const WORD_BRIDGE_MATCH_MS = 350;

/** Pausa entre una ronda resuelta y la siguiente. */
export const WORD_BRIDGE_NEXT_MS = 900;

export type WordBridgeWord = {
  id: string;
  tier: WordBridgeTier;
  /** Solo en los niveles 1 y 2 del banco: lo que se puede dibujar. */
  emoji?: string;
  en: string;
  es: string;
};

/**
 * Las parejas. Cada palabra aparece una sola vez en cada idioma: dos entradas
 * con la misma traducción harían que un tablero tuviera dos respuestas buenas
 * para la misma palabra. `validate:content` lo comprueba.
 *
 * El español es el de Colombia donde hay dos formas (carro, computadora,
 * banano), que es el que ya usa el resto de la aplicación.
 */
export const WORD_BRIDGE_WORDS: WordBridgeWord[] = [
  // ─── 1 · Animales y comida ─────────────────────────────────────
  { id: "dog", tier: 1, emoji: "🐶", en: "dog", es: "perro" },
  { id: "cat", tier: 1, emoji: "🐱", en: "cat", es: "gato" },
  { id: "horse", tier: 1, emoji: "🐴", en: "horse", es: "caballo" },
  { id: "cow", tier: 1, emoji: "🐮", en: "cow", es: "vaca" },
  { id: "pig", tier: 1, emoji: "🐷", en: "pig", es: "cerdo" },
  { id: "bird", tier: 1, emoji: "🐦", en: "bird", es: "pájaro" },
  { id: "fish", tier: 1, emoji: "🐟", en: "fish", es: "pez" },
  { id: "rabbit", tier: 1, emoji: "🐰", en: "rabbit", es: "conejo" },
  { id: "mouse", tier: 1, emoji: "🐭", en: "mouse", es: "ratón" },
  { id: "lion", tier: 1, emoji: "🦁", en: "lion", es: "león" },
  { id: "bear", tier: 1, emoji: "🐻", en: "bear", es: "oso" },
  { id: "monkey", tier: 1, emoji: "🐵", en: "monkey", es: "mono" },
  { id: "duck", tier: 1, emoji: "🦆", en: "duck", es: "pato" },
  { id: "frog", tier: 1, emoji: "🐸", en: "frog", es: "rana" },
  { id: "snake", tier: 1, emoji: "🐍", en: "snake", es: "serpiente" },
  { id: "apple", tier: 1, emoji: "🍎", en: "apple", es: "manzana" },
  { id: "bread", tier: 1, emoji: "🍞", en: "bread", es: "pan" },
  { id: "cheese", tier: 1, emoji: "🧀", en: "cheese", es: "queso" },
  { id: "egg", tier: 1, emoji: "🥚", en: "egg", es: "huevo" },
  { id: "milk", tier: 1, emoji: "🥛", en: "milk", es: "leche" },
  { id: "water", tier: 1, emoji: "💧", en: "water", es: "agua" },
  { id: "coffee", tier: 1, emoji: "☕", en: "coffee", es: "café" },
  { id: "rice", tier: 1, emoji: "🍚", en: "rice", es: "arroz" },
  { id: "chicken", tier: 1, emoji: "🍗", en: "chicken", es: "pollo" },
  { id: "lemon", tier: 1, emoji: "🍋", en: "lemon", es: "limón" },
  { id: "orange", tier: 1, emoji: "🍊", en: "orange", es: "naranja" },
  { id: "grapes", tier: 1, emoji: "🍇", en: "grapes", es: "uvas" },
  { id: "carrot", tier: 1, emoji: "🥕", en: "carrot", es: "zanahoria" },
  { id: "tomato", tier: 1, emoji: "🍅", en: "tomato", es: "tomate" },
  { id: "banana", tier: 1, emoji: "🍌", en: "banana", es: "banano" },

  // ─── 2 · Casa, ropa, viajes y trabajo ──────────────────────────
  { id: "house", tier: 2, emoji: "🏠", en: "house", es: "casa" },
  { id: "bed", tier: 2, emoji: "🛏️", en: "bed", es: "cama" },
  { id: "chair", tier: 2, emoji: "🪑", en: "chair", es: "silla" },
  { id: "door", tier: 2, emoji: "🚪", en: "door", es: "puerta" },
  { id: "window", tier: 2, emoji: "🪟", en: "window", es: "ventana" },
  { id: "key", tier: 2, emoji: "🔑", en: "key", es: "llave" },
  { id: "book", tier: 2, emoji: "📖", en: "book", es: "libro" },
  { id: "clock", tier: 2, emoji: "⏰", en: "clock", es: "reloj" },
  { id: "shirt", tier: 2, emoji: "👕", en: "shirt", es: "camisa" },
  { id: "pants", tier: 2, emoji: "👖", en: "pants", es: "pantalón" },
  { id: "dress", tier: 2, emoji: "👗", en: "dress", es: "vestido" },
  { id: "shoe", tier: 2, emoji: "👞", en: "shoe", es: "zapato" },
  { id: "hat", tier: 2, emoji: "🎩", en: "hat", es: "sombrero" },
  { id: "coat", tier: 2, emoji: "🧥", en: "coat", es: "abrigo" },
  { id: "glasses", tier: 2, emoji: "👓", en: "glasses", es: "gafas" },
  { id: "car", tier: 2, emoji: "🚗", en: "car", es: "carro" },
  { id: "plane", tier: 2, emoji: "✈️", en: "plane", es: "avión" },
  { id: "train", tier: 2, emoji: "🚆", en: "train", es: "tren" },
  { id: "boat", tier: 2, emoji: "⛵", en: "boat", es: "barco" },
  { id: "map", tier: 2, emoji: "🗺️", en: "map", es: "mapa" },
  { id: "backpack", tier: 2, emoji: "🎒", en: "backpack", es: "mochila" },
  { id: "suitcase", tier: 2, emoji: "🧳", en: "suitcase", es: "maleta" },
  { id: "beach", tier: 2, emoji: "🏖️", en: "beach", es: "playa" },
  { id: "computer", tier: 2, emoji: "💻", en: "computer", es: "computadora" },
  { id: "phone", tier: 2, emoji: "📱", en: "phone", es: "teléfono" },
  { id: "money", tier: 2, emoji: "💵", en: "money", es: "dinero" },
  { id: "office", tier: 2, emoji: "🏢", en: "office", es: "oficina" },
  { id: "pen", tier: 2, emoji: "🖊️", en: "pen", es: "bolígrafo" },
  { id: "letter", tier: 2, emoji: "✉️", en: "letter", es: "carta" },
  { id: "umbrella", tier: 2, emoji: "☂️", en: "umbrella", es: "paraguas" },

  // ─── 3 · Verbos y adjetivos ────────────────────────────────────
  { id: "eat", tier: 3, en: "eat", es: "comer" },
  { id: "drink", tier: 3, en: "drink", es: "beber" },
  { id: "sleep", tier: 3, en: "sleep", es: "dormir" },
  { id: "run", tier: 3, en: "run", es: "correr" },
  { id: "walk", tier: 3, en: "walk", es: "caminar" },
  { id: "read", tier: 3, en: "read", es: "leer" },
  { id: "write", tier: 3, en: "write", es: "escribir" },
  { id: "speak", tier: 3, en: "speak", es: "hablar" },
  { id: "listen", tier: 3, en: "listen", es: "escuchar" },
  { id: "work", tier: 3, en: "work", es: "trabajar" },
  { id: "buy", tier: 3, en: "buy", es: "comprar" },
  { id: "open", tier: 3, en: "open", es: "abrir" },
  { id: "close", tier: 3, en: "close", es: "cerrar" },
  { id: "learn", tier: 3, en: "learn", es: "aprender" },
  { id: "travel", tier: 3, en: "travel", es: "viajar" },
  { id: "big", tier: 3, en: "big", es: "grande" },
  { id: "small", tier: 3, en: "small", es: "pequeño" },
  { id: "hot", tier: 3, en: "hot", es: "caliente" },
  { id: "cold", tier: 3, en: "cold", es: "frío" },
  { id: "new", tier: 3, en: "new", es: "nuevo" },
  { id: "old", tier: 3, en: "old", es: "viejo" },
  { id: "happy", tier: 3, en: "happy", es: "feliz" },
  { id: "sad", tier: 3, en: "sad", es: "triste" },
  { id: "fast", tier: 3, en: "fast", es: "rápido" },
  { id: "slow", tier: 3, en: "slow", es: "lento" },
  { id: "easy", tier: 3, en: "easy", es: "fácil" },
  { id: "difficult", tier: 3, en: "difficult", es: "difícil" },
  { id: "cheap", tier: 3, en: "cheap", es: "barato" },
  { id: "expensive", tier: 3, en: "expensive", es: "caro" },
  { id: "tired", tier: 3, en: "tired", es: "cansado" },
];

export type WordBridgeSentence = {
  id: string;
  /**
   * Las palabras de la frase, en orden, tal como irían en mitad de una
   * oración: en minúscula salvo lo que siempre la lleva ("I", "English"). La
   * mayúscula inicial la pone la pantalla al construirla, para que la ficha
   * de la primera palabra no se delate por ser la única en mayúscula.
   */
  en: string[];
  es: string[];
};

/**
 * Frases cortas, sin puntuación y **con un solo orden posible**: una ficha
 * equivocada se rechaza en el momento, así que una frase que admita dos
 * órdenes ("please open the door" / "open the door please") castigaría una
 * respuesta buena. Nada de listas con "y" ni de adverbios que se puedan mover.
 */
export const WORD_BRIDGE_SENTENCES: WordBridgeSentence[] = [
  { id: "dog-bread", en: ["the", "dog", "eats", "bread"], es: ["el", "perro", "come", "pan"] },
  { id: "drink-water", en: ["I", "drink", "water"], es: ["yo", "bebo", "agua"] },
  { id: "big-house", en: ["the", "house", "is", "big"], es: ["la", "casa", "es", "grande"] },
  { id: "cat-sleeps", en: ["my", "cat", "sleeps", "a", "lot"], es: ["mi", "gato", "duerme", "mucho"] },
  { id: "reads-book", en: ["she", "reads", "a", "book"], es: ["ella", "lee", "un", "libro"] },
  { id: "go-beach", en: ["we", "go", "to", "the", "beach"], es: ["nosotros", "vamos", "a", "la", "playa"] },
  { id: "hot-coffee", en: ["the", "coffee", "is", "hot"], es: ["el", "café", "está", "caliente"] },
  { id: "new-suitcase", en: ["I", "have", "a", "new", "suitcase"], es: ["tengo", "una", "maleta", "nueva"] },
  { id: "fast-train", en: ["the", "train", "is", "fast"], es: ["el", "tren", "es", "rápido"] },
  { id: "like-cheese", en: ["I", "like", "cheese"], es: ["me", "gusta", "el", "queso"] },
  { id: "works-office", en: ["he", "works", "in", "an", "office"], es: ["él", "trabaja", "en", "una", "oficina"] },
  { id: "close-door", en: ["close", "the", "door"], es: ["cierra", "la", "puerta"] },
  { id: "old-phone", en: ["my", "phone", "is", "old"], es: ["mi", "teléfono", "es", "viejo"] },
  { id: "fresh-bread", en: ["we", "buy", "fresh", "bread"], es: ["compramos", "pan", "fresco"] },
  { id: "plane-late", en: ["the", "plane", "arrives", "late"], es: ["el", "avión", "llega", "tarde"] },
  { id: "am-tired", en: ["I", "am", "tired"], es: ["estoy", "cansado"] },
  { id: "cold-soup", en: ["the", "soup", "is", "cold"], es: ["la", "sopa", "está", "fría"] },
  { id: "speak-english", en: ["they", "speak", "English"], es: ["ellos", "hablan", "inglés"] },
  { id: "learn-spanish", en: ["I", "want", "to", "learn", "Spanish"], es: ["quiero", "aprender", "español"] },
  { id: "easy-book", en: ["the", "book", "is", "easy"], es: ["el", "libro", "es", "fácil"] },
  { id: "monkey-banana", en: ["the", "monkey", "eats", "a", "banana"], es: ["el", "mono", "come", "un", "banano"] },
  { id: "cheap-shirt", en: ["the", "shirt", "is", "cheap"], es: ["la", "camisa", "es", "barata"] },
  { id: "mom-rice", en: ["my", "mom", "cooks", "rice"], es: ["mi", "mamá", "cocina", "arroz"] },
  { id: "write-letter", en: ["I", "write", "a", "letter"], es: ["escribo", "una", "carta"] },
  { id: "bird-sings", en: ["the", "bird", "sings"], es: ["el", "pájaro", "canta"] },
  { id: "expensive-shoes", en: ["the", "shoes", "are", "expensive"], es: ["los", "zapatos", "son", "caros"] },
  { id: "travel-train", en: ["we", "travel", "by", "train"], es: ["viajamos", "en", "tren"] },
  { id: "open-window", en: ["the", "window", "is", "open"], es: ["la", "ventana", "está", "abierta"] },
  { id: "like-walk", en: ["I", "like", "to", "walk"], es: ["me", "gusta", "caminar"] },
  { id: "happy-friend", en: ["my", "friend", "is", "happy"], es: ["mi", "amigo", "está", "feliz"] },
];

export function shuffleWordBridge<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/** Las palabras que caben en un escalón, según los tramos que pide. */
export function wordBridgePool(tiers: readonly WordBridgeTier[]): WordBridgeWord[] {
  return WORD_BRIDGE_WORDS.filter((word) => tiers.includes(word.tier));
}

/**
 * Las palabras de una sesión de tableros, sin repetir ninguna entre tableros:
 * cada uno saca las suyas de lo que todavía no ha salido.
 */
export function createMatchBoards(level: MatchLevel): WordBridgeWord[][] {
  const pool = shuffleWordBridge(wordBridgePool(level.tiers));
  return Array.from({ length: level.rounds }, (_, round) =>
    pool.slice(round * level.pairs, (round + 1) * level.pairs),
  );
}

export type ListenRound = {
  word: WordBridgeWord;
  /** Las respuestas, revueltas; una es `word`. */
  options: WordBridgeWord[];
};

/**
 * Las rondas de escuchar: palabras distintas, y para cada una tantas
 * respuestas como pida el escalón, sacadas del mismo tramo para que no se
 * distinga la buena por ser la única de su clase (un verbo entre animales).
 */
export function createListenRounds(level: ListenLevel): ListenRound[] {
  const pool = wordBridgePool(level.tiers);
  const words = shuffleWordBridge(pool).slice(0, level.rounds);

  return words.map((word) => {
    const sameTier = pool.filter(
      (candidate) => candidate.tier === word.tier && candidate.id !== word.id,
    );
    const decoys = shuffleWordBridge(sameTier).slice(0, level.options - 1);
    return { word, options: shuffleWordBridge([word, ...decoys]) };
  });
}

export type SentenceTile = { key: string; text: string };

export type SentenceRound = {
  sentence: WordBridgeSentence;
  /** Las fichas de la frase traducida más las de sobra, revueltas. */
  tiles: SentenceTile[];
};

/** Compara dos palabras sin que importe la mayúscula. */
export function sameWord(a: string, b: string, language: Language): boolean {
  return a.toLocaleLowerCase(language) === b.toLocaleLowerCase(language);
}

/**
 * Las rondas de frases. Las fichas de sobra salen de otras frases del mismo
 * idioma y nunca coinciden con una palabra de la frase: una ficha repetida
 * sería otra forma de acertar, no un distractor.
 */
export function createSentenceRounds(
  level: SentenceLevel,
  target: Language,
): SentenceRound[] {
  const sentences = shuffleWordBridge(WORD_BRIDGE_SENTENCES).slice(0, level.rounds);

  return sentences.map((sentence) => {
    const words = sentence[target];
    const others = WORD_BRIDGE_SENTENCES.filter((other) => other.id !== sentence.id)
      .flatMap((other) => other[target])
      .filter((word) => !words.some((own) => sameWord(own, word, target)));
    const unique = [...new Set(others)];
    const decoys = shuffleWordBridge(unique).slice(0, level.decoys);

    const tiles = [...words, ...decoys].map((text, index) => ({
      key: `${sentence.id}-${index}`,
      text,
    }));
    return { sentence, tiles: shuffleWordBridge(tiles) };
  });
}

/** La frase escrita entera, con su mayúscula inicial. */
export function sentenceText(words: readonly string[], language: Language): string {
  const text = words.join(" ");
  return text.charAt(0).toLocaleUpperCase(language) + text.slice(1);
}

/** Cuántas cosas trae una sesión de un escalón, para el progreso de arriba. */
export function wordBridgeItemsPerSession(level: WordBridgeLevel): number {
  const config = WORD_BRIDGE_LEVELS[level];
  return config.mode === "match" ? config.pairs * config.rounds : config.rounds;
}
