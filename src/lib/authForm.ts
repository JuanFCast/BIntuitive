import type { MessageKey } from "./i18n";

/**
 * Validación de los formularios de cuenta, antes de enviar nada a Supabase.
 *
 * Es la primera barrera y la más amable: dice qué falta mientras se escribe,
 * en el idioma puesto, sin esperar a la red. No es la única: la edad la
 * vuelve a comprobar la base al crear el perfil, y si el correo existe o la
 * contraseña es débil lo decide el servidor.
 *
 * Devuelve claves de traducción y no frases: el error se lee en el idioma que
 * esté puesto, y cambiarlo mientras el error está en pantalla lo traduce solo.
 *
 * Las reglas del correo son deliberadamente flojas. Quien de verdad decide si
 * un correo existe es el servidor que lo recibe, y una expresión regular
 * estricta de más solo sirve para rechazar direcciones válidas y raras.
 */
export type FieldError = MessageKey | null;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Ocho caracteres: lo bastante para no ser un descuido, sin dar lecciones. */
export const MIN_PASSWORD_LENGTH = 8;

/** BIntuitive es para personas adultas. */
export const MIN_AGE = 18;

/** Un nombre corto cabe en la cabecera y en el saludo a cualquier tamaño de letra. */
export const NAME_MAX_LENGTH = 40;

export function validateName(value: string): FieldError {
  const name = value.trim();
  if (!name) return "authErrorNameRequired";
  if (name.length > NAME_MAX_LENGTH) return "authErrorNameLong";
  return null;
}

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

/** Al crear la cuenta o cambiar la contraseña sí se pide una longitud mínima. */
export function validateNewPassword(value: string): FieldError {
  if (!value) return "authErrorPasswordRequired";
  if (value.length < MIN_PASSWORD_LENGTH) return "authErrorPasswordShort";
  return null;
}

/**
 * Cuánto aguanta una contraseña, de 0 a 4, para el medidor del registro.
 *
 * Es una pista, no una regla: no bloquea nada por encima de la longitud
 * mínima. Cuenta lo que de verdad alarga la búsqueda —longitud, y mezclar
 * tipos de carácter— y no castiga frases largas sin símbolos, que son de las
 * mejores contraseñas que hay.
 */
export function passwordStrength(value: string): 0 | 1 | 2 | 3 | 4 {
  if (value.length < MIN_PASSWORD_LENGTH) return value ? 1 : 0;

  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((kind) =>
    kind.test(value),
  ).length;

  if (value.length >= 14 || (value.length >= 10 && kinds >= 3)) return 4;
  if (value.length >= 10 || kinds >= 3) return 3;
  return 2;
}

/** La fecha de nacimiento tal como se escribe: tres casillas de números. */
export type BirthdateParts = { day: string; month: string; year: string };

/** `YYYY-MM-DD` si las tres partes forman una fecha real, o `null`. */
export function birthdateToIso({ day, month, year }: BirthdateParts): string | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
    return null;
  }
  if (year.length !== 4 || m < 1 || m > 12 || d < 1) return null;

  // El día 0 del mes siguiente es el último de este: así febrero y los
  // bisiestos salen solos.
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d > daysInMonth) return null;

  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Años cumplidos a fecha de hoy, en la zona del dispositivo. */
export function ageOn(iso: string, today: Date = new Date()): number {
  const [y, m, d] = iso.split("-").map(Number);
  let age = today.getFullYear() - y;
  const birthdayPassed =
    today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
  if (!birthdayPassed) age -= 1;
  return age;
}

export function validateBirthdate(parts: BirthdateParts): FieldError {
  if (!parts.day && !parts.month && !parts.year) return "authErrorBirthdateRequired";

  const iso = birthdateToIso(parts);
  if (!iso) return "authErrorBirthdateInvalid";

  const age = ageOn(iso);
  // Una fecha en el futuro o de hace más de 120 años es una errata, no una edad.
  if (age < 0 || age > 120) return "authErrorBirthdateInvalid";
  if (age < MIN_AGE) return "authErrorUnderage";
  return null;
}

/**
 * Cifras del código de activación que llega por correo. Tiene que coincidir con
 * "Email OTP Length" del proyecto de Supabase (Authentication → Sign In /
 * Providers → Email): si allí se cambia, aquí también.
 */
export const EMAIL_CODE_LENGTH = 6;

/** Deja solo las cifras: se pega el código con espacios o guiones y no pasa nada. */
export function cleanEmailCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, EMAIL_CODE_LENGTH);
}

export function validateEmailCode(value: string): FieldError {
  return cleanEmailCode(value).length === EMAIL_CODE_LENGTH ? null : "authErrorCodeRequired";
}

/** Si un conjunto de errores deja pasar el formulario. */
export function isClean(errors: Record<string, FieldError>): boolean {
  return Object.values(errors).every((error) => error === null);
}
