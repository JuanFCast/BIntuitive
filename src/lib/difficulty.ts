/**
 * La escala de dificultad, común a los nueve hexágonos.
 *
 * Cinco escalones y una valoración de cero a tres estrellas por sesión. Lo que
 * cambia en cada escalón es cosa de cada juego —su tabla lo dice—, pero la
 * escala, el tope y la regla de desbloqueo se deciden una sola vez y aquí.
 *
 * La dificultad no se mueve sola durante una sesión: quien juega elige entre
 * las desbloqueadas y el resultado de la sesión decide si se abre la
 * siguiente. Lo que se desbloquea no se vuelve a bloquear nunca.
 */
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3, 4, 5];

export function clampDifficulty(value: unknown): Difficulty {
  if (typeof value !== "number" || Number.isNaN(value)) return MIN_DIFFICULTY;
  const rounded = Math.round(value);
  if (rounded <= MIN_DIFFICULTY) return MIN_DIFFICULTY;
  if (rounded >= MAX_DIFFICULTY) return MAX_DIFFICULTY;
  return rounded as Difficulty;
}

/** Cero estrellas es un resultado, no la ausencia de uno: se jugó y no llegó. */
export type Stars = 0 | 1 | 2 | 3;

export const MAX_STARS = 3;

/** Dos de tres abren el escalón siguiente, en todos los juegos por igual. */
export const STARS_TO_UNLOCK: Stars = 2;

export function clampStars(value: unknown): Stars {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  const rounded = Math.round(value);
  if (rounded <= 0) return 0;
  if (rounded >= MAX_STARS) return MAX_STARS;
  return rounded as Stars;
}

/**
 * Hasta dónde llega lo desbloqueado después de una sesión.
 *
 * Solo sabe subir: recibe lo que ya estaba abierto y el resultado de la
 * sesión, y devuelve lo que queda abierto. Una mala racha no cierra nada.
 */
export function unlockedAfterSession(
  unlocked: Difficulty,
  played: Difficulty,
  stars: Stars,
): Difficulty {
  if (stars < STARS_TO_UNLOCK) return unlocked;
  return clampDifficulty(Math.max(unlocked, played + 1));
}
