/**
 * El nivel educativo de quien juega.
 *
 * Aquí viven solo las claves, no sus nombres ni su orden en pantalla: eso es
 * de la etapa que construya el selector. Lo que hace falta ahora es una clave
 * estable con la que guardar el progreso, para que el día que se elija grado
 * no haya que mover datos ya guardados de sitio.
 */
export const GRADES = [
  "pre-k",
  "kindergarten",
  "grade-1",
  "grade-2",
  "grade-3",
] as const;

export type Grade = (typeof GRADES)[number];

/**
 * Dónde vive el progreso de quien todavía no ha elegido grado.
 *
 * No es un grado y no debe enseñarse como tal: es el progreso que ya existía
 * antes de que los grados existieran. Atribuirlo a Pre-K o a cualquier otro
 * sería inventarle al niño un curso que nadie dijo. Cuando alguien elija su
 * primer grado, este bloque se mueve allí una sola vez y de forma explícita.
 */
export const UNASSIGNED_GRADE = "unassigned";

export type GradeKey = Grade | typeof UNASSIGNED_GRADE;

export function isGrade(value: unknown): value is Grade {
  return (
    typeof value === "string" && (GRADES as readonly string[]).includes(value)
  );
}

export function isGradeKey(value: unknown): value is GradeKey {
  return value === UNASSIGNED_GRADE || isGrade(value);
}
