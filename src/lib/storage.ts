import type { CategoryId } from "@/data/questions";

const PROGRESS_KEY = "beesmart-progress";
const MUTE_KEY = "beesmart-muted";

export type SessionSummary = {
  date: string;
  category: CategoryId;
  stars: number;
  total: number;
};

export type Progress = {
  sessions: SessionSummary[];
  totalStars: number;
  levelByCategory: Partial<Record<CategoryId, number>>;
};

const emptyProgress: Progress = {
  sessions: [],
  totalStars: 0,
  levelByCategory: {},
};

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
