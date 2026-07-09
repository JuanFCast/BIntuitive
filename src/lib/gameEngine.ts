import { questions, type CategoryId, type Question } from "@/data/questions";

export const ROUNDS_PER_SESSION = 5;
export const MAX_ATTEMPTS = 2;

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Elige la siguiente pregunta de la categoría, prefiriendo el nivel actual
 * y cayendo al nivel más cercano si ya no quedan preguntas de ese nivel.
 */
export function pickNextQuestion(
  category: CategoryId,
  level: number,
  usedIds: string[],
): Question | null {
  const available = questions.filter(
    (q) => q.category === category && !usedIds.includes(q.id),
  );
  if (available.length === 0) return null;

  const sorted = [...available].sort(
    (a, b) => Math.abs(a.level - level) - Math.abs(b.level - level),
  );
  const bestDistance = Math.abs(sorted[0].level - level);
  const candidates = sorted.filter(
    (q) => Math.abs(q.level - level) === bestDistance,
  );
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Dificultad suave: sube tras 2 aciertos seguidos al primer intento,
 * baja si el niño falla la pregunta completa.
 */
export function nextLevel(
  level: number,
  streak: number,
  failed: boolean,
): { level: number; streak: number } {
  if (failed) {
    return { level: Math.max(1, level - 1), streak: 0 };
  }
  const newStreak = streak + 1;
  if (newStreak >= 2 && level < 3) {
    return { level: level + 1, streak: 0 };
  }
  return { level, streak: newStreak };
}
