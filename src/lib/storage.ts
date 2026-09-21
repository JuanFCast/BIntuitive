import type { GameId } from "@/data/categories";
import type { CategoryId } from "@/data/questions";
import {
  clampStars,
  unlockedAfterSession,
  type Difficulty,
  type Stars,
} from "./difficulty";
import { UNASSIGNED_GRADE, type GradeKey } from "./grade";
import {
  createGameProgress,
  normalizeByGrade,
  projectLegacyProgress,
  type ByGrade,
  type GameProgress,
} from "./progressModel";

const PROGRESS_KEY = "bintuitive-progress";

/**
 * Versión del progreso guardado.
 *
 * La 1 no se escribía: es todo lo que hay en dispositivos de antes del modelo
 * por grado y dificultad. La 2 añade `byGrade` **sin quitar un solo campo de
 * la 1**, porque mientras los juegos sigan escribiendo en los campos antiguos
 * hay que poder volver atrás sin que nadie pierda su progreso.
 *
 * Las dos conviven a propósito y de forma temporal: `projectLegacyProgress`
 * las mantiene de acuerdo en cada lectura, siempre en la dirección 1 → 2 y sin
 * que un dato de la 1 pueda rebajar uno de la 2. Ese puente —y con él los
 * campos de la 1— se retira al subir a la versión 3; las condiciones exactas
 * están escritas sobre `projectLegacyProgress`, en `progressModel.ts`.
 *
 * La prueba que protege todo esto es `npm run check:migration`.
 */
export const PROGRESS_VERSION = 2;
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
  /** Qué forma tiene lo guardado. Ausente significa 1, de antes de `byGrade`. */
  version: number;
  /**
   * Dificultad, desbloqueo y marcas de cada actividad, separadas por grado.
   *
   * Todo lo que había antes de que existieran los grados vive bajo
   * `unassigned`: nadie ha elegido curso todavía y atribuírselo a uno sería
   * inventarlo. Se proyecta desde los campos de abajo en cada lectura, así que
   * los dos modelos no pueden discrepar mientras los juegos sigan escribiendo
   * en los antiguos.
   */
  byGrade: ByGrade;
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
    version: PROGRESS_VERSION,
    byGrade: {},
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
    const legacy = {
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

    // Lo antiguo se lee tal cual y encima se calcula lo nuevo. Proyectar en
    // cada lectura, en vez de convertir una vez y olvidarse, es lo que
    // mantiene los dos modelos de acuerdo mientras los juegos escriban todavía
    // en los campos de la versión 1.
    return {
      ...legacy,
      version: PROGRESS_VERSION,
      byGrade: projectLegacyProgress(legacy, normalizeByGrade(parsed.byGrade)),
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
 * Guarda una sesión terminada de Trazos.
 *
 * Escribe **una sola vez y en los dos modelos a la vez**: el nuevo, bajo
 * `byGrade.unassigned`, y los campos de la versión 1, con exactamente los
 * mismos totales acumulados. Que sean iguales es lo que hace que la proyección
 * del puente —que se queda con el mejor de los dos— no pueda sumar una sesión
 * dos veces ni duplicar ejercicios o intentos.
 *
 * Los acumuladores suman, las marcas se quedan con la mejor y el desbloqueo
 * solo sube. El escalón elegido se guarda tal cual, porque repetir un nivel ya
 * abierto es justamente lo que se quiere poder hacer.
 *
 * Una sesión abandonada no llega aquí: el juego solo llama al terminar.
 */
export function saveTracingResult(result: {
  /** El escalón que se acaba de jugar. */
  playedLevel: Difficulty;
  /** La valoración de la sesión, de cero a tres. */
  sessionStars: Stars;
  /** Estrellas sumadas de los trazos, que es lo que contaba la versión 1. */
  exerciseStars: number;
  completed: number;
  accuracy: number;
  attempts: number;
  /** ISO. Lo pasa el juego para que esto no dependa del reloj. */
  playedAt: string;
}): void {
  const progress = getProgress();
  const current = getUnassignedGameProgress(progress, "tracing");
  const legacy = normalizeTracing(progress.tracing);

  const unlocked = unlockedAfterSession(
    current.unlocked,
    result.playedLevel,
    result.sessionStars,
  );
  const completed = (current.best.completed ?? 0) + result.completed;
  const attempts = (current.best.attempts ?? 0) + result.attempts;
  const accuracy = Math.max(current.best.accuracy ?? 0, result.accuracy);

  const next: GameProgress<"tracing"> = {
    difficulty: result.playedLevel,
    unlocked,
    stars: clampStars(Math.max(current.stars, result.sessionStars)),
    sessions: current.sessions + 1,
    lastPlayedAt: result.playedAt,
    best: { accuracy, completed, attempts },
  };

  const unassigned = { ...(progress.byGrade[UNASSIGNED_GRADE] ?? {}) };
  unassigned.tracing = next;
  progress.byGrade = { ...progress.byGrade, [UNASSIGNED_GRADE]: unassigned };

  // El espejo de la versión 1, con los mismos totales. `level` guarda lo
  // desbloqueado y no lo elegido: es lo que entendía el código anterior por
  // "hasta dónde ha llegado", así que revertir el despliegue no degrada a
  // nadie por haber estado repitiendo un nivel fácil.
  progress.tracing = normalizeTracing({
    level: unlocked,
    completed,
    stars: legacy.stars + result.exerciseStars,
    bestAccuracy: accuracy,
    attempts,
  });

  saveProgress(progress);
}

/**
 * El progreso de una actividad dentro de un grado.
 *
 * Nunca devuelve `undefined`: quien pregunta es para pintar algo, y "todavía
 * no se ha jugado" es exactamente un escalón 1 sin nada desbloqueado por
 * encima. Para distinguir las dos cosas está `hasGameProgress`.
 */
export function getGameProgress<Id extends GameId>(
  progress: Progress,
  grade: GradeKey,
  id: Id,
): GameProgress<Id> {
  const stored = progress.byGrade[grade]?.[id];
  return (stored as GameProgress<Id> | undefined) ?? createGameProgress(id);
}

/** El progreso de quien todavía no ha elegido grado. */
export function getUnassignedGameProgress<Id extends GameId>(
  progress: Progress,
  id: Id,
): GameProgress<Id> {
  return getGameProgress(progress, UNASSIGNED_GRADE, id);
}

/** Si hay algo guardado de esa actividad en ese grado. */
export function hasGameProgress(
  progress: Progress,
  grade: GradeKey,
  id: GameId,
): boolean {
  return progress.byGrade[grade]?.[id] !== undefined;
}

/** Cuántas actividades tienen algo guardado en ese grado. */
export function countPlayedGames(
  progress: Progress,
  grade: GradeKey,
): number {
  return Object.keys(progress.byGrade[grade] ?? {}).length;
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
