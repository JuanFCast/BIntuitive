import type { CategoryId } from "@/data/questions";

const PROGRESS_KEY = "bintuitive-progress";
const MUTE_KEY = "bintuitive-muted";

export type SessionSummary = {
  date: string;
  category: CategoryId;
  stars: number;
  total: number;
};

/** Progreso local de Word Puzzle: nivel alcanzado y mejor marca. */
export type WordPuzzleProgress = {
  level: number;
  bestPerfectWords: number;
};

export type Progress = {
  sessions: SessionSummary[];
  totalStars: number;
  levelByCategory: Partial<Record<CategoryId, number>>;
  wordPuzzle?: WordPuzzleProgress;
};

const emptyProgress: Progress = {
  sessions: [],
  totalStars: 0,
  levelByCategory: {},
};

function clampLevel(level: unknown): number {
  return typeof level === "number" && level >= 1 && level <= 3 ? level : 1;
}

function normalizeWordPuzzle(
  stored: Partial<WordPuzzleProgress> | undefined,
): WordPuzzleProgress {
  return {
    level: clampLevel(stored?.level),
    bestPerfectWords:
      typeof stored?.bestPerfectWords === "number" && stored.bestPerfectWords > 0
        ? stored.bestPerfectWords
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
      ...(parsed.wordPuzzle
        ? { wordPuzzle: normalizeWordPuzzle(parsed.wordPuzzle) }
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

export function getWordPuzzleProgress(): WordPuzzleProgress {
  return normalizeWordPuzzle(getProgress().wordPuzzle);
}

/** Guarda el nivel alcanzado y conserva siempre la mejor marca anterior. */
export function saveWordPuzzleProgress(next: WordPuzzleProgress): void {
  const progress = getProgress();
  progress.wordPuzzle = {
    level: clampLevel(next.level),
    bestPerfectWords: Math.max(
      next.bestPerfectWords,
      progress.wordPuzzle?.bestPerfectWords ?? 0,
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
