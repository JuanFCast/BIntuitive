import type { CategoryId } from "@/data/questions";

const PROGRESS_KEY = "bintuitive-progress";
const MUTE_KEY = "bintuitive-muted";
const TEXT_SIZE_KEY = "bintuitive-text-size";

/** Tamaño de letra elegido. Es una preferencia, no progreso educativo. */
export type TextSize = "normal" | "large" | "xlarge";

const TEXT_SIZES: TextSize[] = ["normal", "large", "xlarge"];

/**
 * Preferencias que la interfaz debe reflejar en cuanto cambian, se cambien
 * desde donde se cambien. `localStorage` no avisa a la propia pestaña, así que
 * quien escribe avisa aquí y los componentes se suscriben con
 * `useSyncExternalStore`. El valor sigue viviendo solo en `localStorage`: esto
 * no es una segunda fuente de verdad, solo el aviso de que cambió.
 */
const preferenceListeners = new Set<() => void>();

export function subscribeToPreferences(listener: () => void): () => void {
  preferenceListeners.add(listener);
  return () => {
    preferenceListeners.delete(listener);
  };
}

function notifyPreferenceChange(): void {
  preferenceListeners.forEach((listener) => listener());
}

export type SessionSummary = {
  date: string;
  category: CategoryId;
  stars: number;
  total: number;
};

/** Progreso local de Word Scramble: nivel alcanzado y mejor marca. */
export type WordScrambleProgress = {
  level: number;
  bestPerfectWords: number;
};

/** Progreso local de Word Search: nivel alcanzado y mejor marca de palabras. */
export type WordSearchProgress = {
  level: number;
  bestWordsFound: number;
};

/**
 * Progreso local de Trazos. Es el único juego independiente que acumula: nivel
 * alcanzado, ejercicios completados, estrellas ganadas, mejor precisión e
 * intentos. Las estrellas son suyas y no tocan `totalStars`, que es de las
 * lecciones de preguntas.
 *
 * La forma es la misma que tendría una fila remota, así que el día que haya
 * base de datos solo cambia dónde se guarda, no qué se guarda.
 */
export type TracingProgress = {
  level: number;
  completed: number;
  stars: number;
  bestAccuracy: number;
  attempts: number;
};

export type Progress = {
  sessions: SessionSummary[];
  totalStars: number;
  levelByCategory: Partial<Record<CategoryId, number>>;
  wordScramble?: WordScrambleProgress;
  /** Sopa de letras. Campo propio: no comparte nada con `wordScramble`. */
  wordSearch?: WordSearchProgress;
  /** Trazos. Campo propio, opcional: los datos ya guardados no lo traen. */
  tracing?: TracingProgress;
  /**
   * Nombre anterior del juego, cuando se llamaba "Word Puzzle". Se sigue
   * leyendo para no perder el progreso ya guardado, y se conserva al escribir
   * por si se revierte el despliegue. No escribir aquí en código nuevo.
   */
  wordPuzzle?: WordScrambleProgress;
};

/**
 * Progreso recién estrenado, siempre en un objeto nuevo.
 *
 * Tiene que serlo: `saveSession` y las dos de palabras escriben sobre lo que
 * devuelve `getProgress()`, así que compartir una única constante hacía que la
 * primera partida de un dispositivo sin datos la ensuciara para el resto de la
 * sesión. Se notaba justo después de borrar el progreso, cuando ya no hay nada
 * guardado que leer y la copia contaminada volvía a salir como si lo hubiera.
 */
function createEmptyProgress(): Progress {
  return {
    sessions: [],
    totalStars: 0,
    levelByCategory: {},
  };
}

function clampLevel(level: unknown): number {
  return typeof level === "number" && level >= 1 && level <= 3 ? level : 1;
}

function normalizeWordScramble(
  stored: Partial<WordScrambleProgress> | undefined,
): WordScrambleProgress {
  return {
    level: clampLevel(stored?.level),
    bestPerfectWords:
      typeof stored?.bestPerfectWords === "number" &&
      stored.bestPerfectWords > 0
        ? stored.bestPerfectWords
        : 0,
  };
}

function normalizeWordSearch(
  stored: Partial<WordSearchProgress> | undefined,
): WordSearchProgress {
  return {
    level: clampLevel(stored?.level),
    bestWordsFound:
      typeof stored?.bestWordsFound === "number" && stored.bestWordsFound > 0
        ? stored.bestWordsFound
        : 0,
  };
}

function normalizeTracing(
  stored: Partial<TracingProgress> | undefined,
): TracingProgress {
  const counter = (value: unknown) =>
    typeof value === "number" && value > 0 ? Math.floor(value) : 0;
  // Cuántos niveles tiene Trazos es cosa suya: aquí solo se guarda que sea un
  // nivel y no un número raro, y el juego lo recorta con `clampTracingLevel`
  // al empezar. Repetir el máximo aquí sería un segundo sitio que mantener.
  const level =
    typeof stored?.level === "number" ? Math.round(stored.level) : 1;

  return {
    level: Math.max(level, 1),
    completed: counter(stored?.completed),
    stars: counter(stored?.stars),
    bestAccuracy: Math.min(counter(stored?.bestAccuracy), 100),
    attempts: counter(stored?.attempts),
  };
}

export function getProgress(): Progress {
  if (typeof window === "undefined") return createEmptyProgress();
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw) as Progress;
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      totalStars: typeof parsed.totalStars === "number" ? parsed.totalStars : 0,
      levelByCategory: parsed.levelByCategory ?? {},
      ...(parsed.wordScramble
        ? { wordScramble: normalizeWordScramble(parsed.wordScramble) }
        : {}),
      ...(parsed.wordPuzzle
        ? { wordPuzzle: normalizeWordScramble(parsed.wordPuzzle) }
        : {}),
      ...(parsed.wordSearch
        ? { wordSearch: normalizeWordSearch(parsed.wordSearch) }
        : {}),
      ...(parsed.tracing ? { tracing: normalizeTracing(parsed.tracing) } : {}),
    };
  } catch {
    return createEmptyProgress();
  }
}

function saveProgress(progress: Progress): void {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Sin almacenamiento disponible: el juego sigue funcionando sin guardar.
  }
}

export function saveSession(summary: SessionSummary, newLevel: number): void {
  const progress = getProgress();
  progress.sessions.push(summary);
  if (progress.sessions.length > 50) {
    progress.sessions = progress.sessions.slice(-50);
  }
  progress.totalStars += summary.stars;
  progress.levelByCategory[summary.category] = newLevel;
  saveProgress(progress);
}

export function getLevelForCategory(category: CategoryId): number {
  const level = getProgress().levelByCategory[category];
  return level && level >= 1 && level <= 3 ? level : 1;
}

/**
 * Lee el progreso del juego, aceptando el campo antiguo `wordPuzzle` de quien
 * ya jugó antes del cambio de nombre.
 */
export function getWordScrambleProgress(): WordScrambleProgress {
  const progress = getProgress();
  return normalizeWordScramble(progress.wordScramble ?? progress.wordPuzzle);
}

/**
 * Guarda el nivel alcanzado y conserva siempre la mejor marca anterior, venga
 * del campo nuevo o del antiguo. Escribe solo en `wordScramble`; `wordPuzzle`
 * se deja intacto para que revertir el despliegue no pierda el progreso.
 */
export function saveWordScrambleProgress(next: WordScrambleProgress): void {
  const progress = getProgress();
  const previous = progress.wordScramble ?? progress.wordPuzzle;
  progress.wordScramble = {
    level: clampLevel(next.level),
    bestPerfectWords: Math.max(
      next.bestPerfectWords,
      previous?.bestPerfectWords ?? 0,
    ),
  };
  saveProgress(progress);
}

/** Progreso de la sopa de letras. Independiente del de Word Scramble. */
export function getWordSearchProgress(): WordSearchProgress {
  return normalizeWordSearch(getProgress().wordSearch);
}

/** Guarda el nivel alcanzado y conserva siempre la mejor marca anterior. */
export function saveWordSearchProgress(next: WordSearchProgress): void {
  const progress = getProgress();
  progress.wordSearch = {
    level: clampLevel(next.level),
    bestWordsFound: Math.max(
      next.bestWordsFound,
      progress.wordSearch?.bestWordsFound ?? 0,
    ),
  };
  saveProgress(progress);
}

/**
 * Borra el progreso educativo de este dispositivo: estrellas, niveles, mejores
 * marcas y sesiones guardadas, incluido el campo heredado `wordPuzzle`.
 *
 * Quita solo la clave del progreso. Las preferencias —idioma, sonido y tamaño
 * de texto— y el perfil de quien juega (`bintuitive-profile`) viven en claves
 * propias y no se tocan: quien borra su progreso no pide que la aplicación
 * vuelva a hablarle en otro idioma ni dejar de llamarse como se llama. Por eso
 * nunca se usa `localStorage.clear()`, que se llevaría también lo que no es
 * progreso.
 */
export function getTracingProgress(): TracingProgress {
  return normalizeTracing(getProgress().tracing);
}

/**
 * Guarda una sesión de Trazos sobre lo que ya había: el nivel se sustituye, la
 * mejor precisión se queda con la más alta y ejercicios, estrellas e intentos
 * se suman. El juego cuenta lo que pasó en su sesión y no tiene que saber lo
 * que había antes.
 */
export function saveTracingSession(session: {
  level: number;
  completed: number;
  stars: number;
  accuracy: number;
  attempts: number;
}): void {
  const progress = getProgress();
  const stored = normalizeTracing(progress.tracing);

  progress.tracing = normalizeTracing({
    level: session.level,
    completed: stored.completed + session.completed,
    stars: stored.stars + session.stars,
    bestAccuracy: Math.max(stored.bestAccuracy, session.accuracy),
    attempts: stored.attempts + session.attempts,
  });
  saveProgress(progress);
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Sin almacenamiento disponible no había nada que borrar.
  }
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Ignorar si no hay almacenamiento.
  }
  notifyPreferenceChange();
}

export function getTextSize(): TextSize {
  if (typeof window === "undefined") return "normal";
  const saved = window.localStorage.getItem(TEXT_SIZE_KEY);
  return TEXT_SIZES.find((size) => size === saved) ?? "normal";
}

export function setTextSize(size: TextSize): void {
  try {
    window.localStorage.setItem(TEXT_SIZE_KEY, size);
  } catch {
    // Ignorar si no hay almacenamiento.
  }
  notifyPreferenceChange();
}
