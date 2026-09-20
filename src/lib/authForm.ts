import type { MessageKey } from "./i18n";

/**
 * Validación visual de los formularios de cuenta.
 *
 * Es lo único que hacen esos formularios: comprobar que lo escrito tiene
 * sentido antes de enseñar el aviso de que las cuentas todavía no existen. No
 * hay usuarios, ni sesión, ni nada que guardar, así que aquí no se llama a
 * ningún servicio ni se toca `localStorage`.
 *
 * Devuelve claves de traducción y no frases: el error se lee en el idioma que
 * esté puesto, y cambiarlo mientras el error está en pantalla lo traduce solo.
 *
 * Las reglas son deliberadamente flojas. Quien de verdad decide si un correo
 * existe es el servidor que algún día lo reciba, y una expresión regular
 * estricta de más solo sirve para rechazar direcciones válidas y raras.
 */
export type FieldError = MessageKey | null;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Ocho caracteres: lo bastante para no ser un descuido, sin dar lecciones. */
export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(value: string): FieldError {
  const email = value.trim();
  if (!email) return "authErrorEmailRequired";
  if (!EMAIL_SHAPE.test(email)) return "authErrorEmailInvalid";
  return null;
}

/** En el inicio de sesión basta con que haya algo: la longitud no es asunto suyo. */
export function validatePasswordPresence(value: string): FieldError {
  return value ? null : "authErrorPasswordRequired";
}

/** Al crear la cuenta sí se pide una longitud mínima. */
export function validateNewPassword(value: string): FieldError {
  if (!value) return "authErrorPasswordRequired";
  if (value.length < MIN_PASSWORD_LENGTH) return "authErrorPasswordShort";
  return null;
}

export function validateConfirmation(
  password: string,
  confirmation: string,
): FieldError {
  if (!confirmation) return "authErrorConfirmRequired";
  if (password !== confirmation) return "authErrorPasswordMismatch";
  return null;
}

/** Si un conjunto de errores deja pasar el formulario. */
export function isClean(errors: Record<string, FieldError>): boolean {
  return Object.values(errors).every((error) => error === null);
}
