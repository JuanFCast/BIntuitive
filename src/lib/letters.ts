/**
 * Utilidades de letras compartidas por los juegos de palabras.
 *
 * Vive aparte de cada juego porque el manejo de Unicode es el mismo para
 * todos: no es lógica de Word Scramble ni de Word Search, es la base sobre la
 * que ambos cuentan letras.
 */

/**
 * Separa una palabra en letras.
 *
 * Normaliza a NFC (composición, nunca eliminación de diacríticos) porque "Á"
 * puede venir como un solo carácter o como "A" + tilde combinante; sin esto la
 * segunda forma se rompería en dos letras. `Ñ`, `Ü` y las vocales acentuadas
 * quedan cada una como una única letra independiente: `Ñ` nunca es `N`.
 */
export function getWordLetters(word: string): string[] {
  return [...word.normalize("NFC")];
}

/** Alfabetos admitidos por idioma, con la ortografía real del español. */
export const WORD_ALPHABET: Record<"en" | "es", RegExp> = {
  en: /^[A-Z]+$/,
  es: /^[A-ZÁÉÍÓÚÑÜ]+$/,
};
