import type { CategoryId } from "@/data/questions";

const PROGRESS_KEY = "bintuitive-progress";
const MUTE_KEY = "bintuitive-muted";

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

export type Progress = {
  sessions: SessionSummary[];
  totalStars: number;
  levelByCategory: Partial<Record<CategoryId, number>>;
  wordScramble?: WordScrambleProgress;
  /** Sopa de letras. Campo propio: no comparte nada con `wordScramble`. */
  wordSearch?: WordSearchProgress;
  /**
   * Nombre anterior del juego, cuando se llamaba "Word Puzzle". Se sigue
   * leyendo para no perder el progreso ya guardado, y se conserva al escribir
   * por si se revierte el despliegue. No escribir aquí en código nuevo.
   */
  wordPuzzle?: WordScrambleProgress;
};

const emptyProgress: Progress = {
  sessions: [],
  totalStars: 0,
  levelByCategory: {},
};

function clampLevel(level: unknown): number {
  return typeof level === "number" && level >= 1 && level <= 3 ? level : 1;
}

function normalizeWordScramble(
  stored: Partial<WordScrambleProgress> | undefined,
): WordScrambleProgress {
  return {
    level: clampLevel(stored?.level),
    bestPerfectWords:
      typeof stored?.bestPerfectWords === "number" && stored.bestPerfectWords > 0
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

export function getProgress(): Progress {
  if (typeof window === "undefined") return emptyProgress;
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress;
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
    };
  } catch {
    return emptyProgress;
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
}
