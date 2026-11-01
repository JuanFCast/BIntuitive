import { clampDifficulty, type Stars } from "./difficulty";
import type { Language } from "./language";

/** Lo que dura una sesión del escalón que era el único que había. */
export const TYPING_DURATION_SECONDS = 30;

export const TYPING_MAX_LEVEL = 5;

export type TypingLevel = 1 | 2 | 3 | 4 | 5;

export type TypingStats = {
  wpm: number;
  accuracy: number;
  mistakes: number;
  progress: number;
};

/**
 * Recorta al rango de este juego. Cuántos escalones tiene lo sabe solo este
 * archivo; `storage.ts` guarda el número tal cual.
 */
export function clampTypingLevel(value: unknown): TypingLevel {
  const level = clampDifficulty(value);
  return Math.min(level, TYPING_MAX_LEVEL) as TypingLevel;
}

/**
 * Qué se escribe en cada escalón, y cuánto dura.
 *
 * Aquí la dificultad **no** es la longitud del texto sino **qué teclas hay que
 * alcanzar**, que es lo que de verdad cuesta cuando se empieza:
 *
 * - Los dos primeros son palabras sueltas, en minúscula y sin signos: solo
 *   letras y la barra espaciadora. Quien no sabe todavía dónde está cada letra
 *   no puede empezar por una frase de setenta caracteres con comas y
 *   mayúsculas, que es lo único que este juego ofrecía hasta ahora.
 * - El tercero son frases cortas, también en minúscula: aparece el ritmo de
 *   escribir seguido, sin añadir teclas nuevas.
 * - El cuarto trae las frases largas tal y como están escritas, con mayúscula
 *   inicial y puntuación: entran la tecla de mayúsculas y los signos.
 * - El quinto es el mismo texto con más tiempo. Es el único sitio donde la
 *   duración cuenta como dificultad, y aquí sí lo es: lo que se mide son
 *   pulsaciones por minuto, y sostener la precisión cuando la mano se cansa es
 *   parte de la destreza. En un juego de mirar no lo sería.
 */
export const TYPING_LEVELS: Record<
  TypingLevel,
  {
    /** De qué banco sale el texto. */
    source: "shortWords" | "longWords" | "shortPhrases" | "phrases";
    seconds: number;
  }
> = {
  1: { source: "shortWords", seconds: 20 },
  2: { source: "longWords", seconds: 25 },
  3: { source: "shortPhrases", seconds: 30 },
  4: { source: "phrases", seconds: 30 },
  5: { source: "phrases", seconds: 45 },
};

/**
 * La valoración de la sesión, de cero a tres, por la precisión.
 *
 * Mismos cortes que los demás juegos de la escala. **No** entran las
 * pulsaciones por minuto: un escalón de palabras de tres letras se teclea
 * mucho más rápido que uno de frases con comas, así que premiar la velocidad
 * haría que el escalón fácil puntuara mejor que el difícil. La precisión sí
 * significa lo mismo en los cinco.
 */
export function typingSessionStars(
  accuracy: number,
  completed: boolean,
): Stars {
  if (!completed) return 0;
  if (accuracy >= 90) return 3;
  if (accuracy >= 75) return 2;
  return 1;
}

const PHRASES: Record<Language, string[]> = {
  en: [
    "Learning a little every day can lead to remarkable progress.",
    "A curious mind turns every question into a new adventure.",
    "Clear ideas grow when we read, practice, and ask why.",
    "A steady rhythm is often faster than a rushed beginning.",
    "Small challenges help the brain become stronger and more flexible.",
    "The best way to improve a skill is to practice it with patience.",
    "Books, music, numbers, and nature are full of patterns to discover.",
    "Accuracy comes first, and speed follows with consistent practice.",
  ],
  es: [
    "Aprender un poco cada día puede producir un progreso sorprendente.",
    "Una mente curiosa convierte cada pregunta en una nueva aventura.",
    "Las ideas claras crecen cuando leemos, practicamos y preguntamos por qué.",
    "Un ritmo constante suele ser más rápido que un comienzo apresurado.",
    "Los pequeños retos ayudan al cerebro a ser más fuerte y flexible.",
    "La mejor manera de mejorar una habilidad es practicar con paciencia.",
    "Los libros, la música y la naturaleza esconden patrones por descubrir.",
    "Primero llega la precisión y luego la velocidad con práctica constante.",
  ],
};

/**
 * Palabras y frases cortas de los tres primeros escalones.
 *
 * Contenido nuevo, escrito para que el juego sirva a quien está aprendiendo
 * dónde está cada letra: **todo en minúscula y sin un solo signo**, porque un
 * punto o una mayúscula obligan a una tecla que todavía no toca. Las tildes y
 * la Ñ sí están, que son ortografía y no adorno —en español `camión` se
 * escribe con tilde—, y los dos idiomas tienen sus propias palabras: no es una
 * traducción, igual que en los demás bancos de la aplicación.
 *
 * Está pendiente de la revisión de contenido, como el resto de los bancos.
 */
const SHORT_WORDS: Record<Language, string[]> = {
  en: [
    "sun", "cat", "dog", "red", "box", "cup", "hat", "bus",
    "egg", "fish", "tree", "star", "moon", "cake", "bird", "milk",
  ],
  es: [
    "sol", "pan", "pez", "luz", "mar", "ojo", "oso", "rey",
    "casa", "luna", "flor", "mesa", "nube", "gato", "pato", "niño",
  ],
};

const LONG_WORDS: Record<Language, string[]> = {
  en: [
    "window", "yellow", "pencil", "rabbit", "garden", "orange",
    "flower", "monkey", "guitar", "rocket", "forest", "butter",
  ],
  es: [
    "ventana", "amarillo", "lápiz", "conejo", "jardín", "naranja",
    "mariposa", "camión", "guitarra", "montaña", "pequeño", "cuaderno",
  ],
};

const SHORT_PHRASES: Record<Language, string[]> = {
  en: [
    "the cat sleeps on the bed",
    "my dog runs in the park",
    "we read a book together",
    "the sun is very warm today",
    "i like to draw and paint",
    "the bird sings in the tree",
    "the moon comes out at night",
    "my sister plays with me",
    "we walk slowly to school",
    "the red ball rolls away",
    "i can count to ten",
    "the fish swims in the water",
  ],
  es: [
    "el gato duerme en la cama",
    "mi perro corre en el parque",
    "leemos un libro juntos",
    "hoy el sol calienta mucho",
    "me gusta dibujar y pintar",
    "el pájaro canta en el árbol",
    "la luna sale por la noche",
    "mi hermana juega conmigo",
    "caminamos despacio al colegio",
    "la pelota roja rueda lejos",
    "puedo contar hasta diez",
    "el pez nada en el agua",
  ],
};

const BANKS: Record<
  (typeof TYPING_LEVELS)[TypingLevel]["source"],
  Record<Language, string[]>
> = {
  shortWords: SHORT_WORDS,
  longWords: LONG_WORDS,
  shortPhrases: SHORT_PHRASES,
  phrases: PHRASES,
};

/** Banco de frases del idioma. Mismo estilo que `getWordBank` y `getSearchBank`. */
export function getTypingPhrases(language: Language): string[] {
  return PHRASES[language];
}

/** Lo que se teclea en un escalón, sin montar todavía el texto seguido. */
export function getTypingBank(
  language: Language,
  level: TypingLevel,
): string[] {
  return BANKS[TYPING_LEVELS[level].source][language];
}

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * Monta el texto seguido que se teclea durante la sesión.
 *
 * Se pide más de lo que da tiempo a escribir a propósito: el texto no puede
 * acabarse antes que el reloj, y lo que se mide es cuánto se avanza en él. Por
 * eso el largo mínimo se calcula contra la duración del escalón en vez de
 * llevar un número fijo: cuarenta y cinco segundos piden más texto que veinte.
 *
 * El margen son `TYPING_CHARS_PER_SECOND` caracteres por segundo, que es el
 * mismo que tenía el número fijo de antes (240 para 30 s). Son unas 96
 * pulsaciones por minuto: muy por encima de lo que teclea un adulto con
 * práctica, así que el texto no se acaba ni en el mejor de los casos. No
 * subirlo pensando en "por si acaso": cada punto obliga a escribir más banco.
 */
export const TYPING_CHARS_PER_SECOND = 8;

export function buildTypingPassage(
  language: Language,
  level: TypingLevel = 4,
  minLength = TYPING_LEVELS[level].seconds * TYPING_CHARS_PER_SECOND,
): string {
  const entries = shuffle(getTypingBank(language, level));
  const selected: string[] = [];
  let length = 0;
  let index = 0;

  while (length < minLength) {
    const entry = entries[index % entries.length];
    selected.push(entry);
    length += entry.length + 1;
    index += 1;
  }

  return selected.join(" ");
}

export function computeTypingStats(
  typed: string,
  passage: string,
  elapsedMilliseconds: number,
  mistakeCount: number,
): TypingStats {
  let correct = 0;
  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === passage[index]) correct += 1;
  }

  const elapsedMinutes = Math.max(elapsedMilliseconds / 60000, 1 / 60);
  const wpm = Math.round(correct / 5 / elapsedMinutes);
  const accuracy = typed.length === 0 ? 1 : correct / typed.length;
  const progress = passage.length === 0 ? 0 : typed.length / passage.length;

  return {
    wpm,
    accuracy,
    mistakes: mistakeCount,
    progress: Math.min(progress, 1),
  };
}
