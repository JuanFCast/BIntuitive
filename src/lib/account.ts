"use client";

import { useSyncExternalStore } from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import type { MessageKey } from "./i18n";
import type { Language } from "./language";
import { getSupabase, IS_SUPABASE_CONFIGURED } from "./supabase";
import { AUTH_CALLBACK, RESET_PASSWORD } from "./routes";

/**
 * La cuenta de quien juega: registro, entrada, salida y contraseña.
 *
 * Todo pasa por aquí y nada más importa el cliente de Supabase para la
 * cuenta, así que el día que llegue Google (u otro proveedor) se añade una
 * función en este archivo y las pantallas no cambian.
 *
 * La cuenta es de la persona adulta que juega: no hay cuentas de tutor ni
 * perfiles colgando de otra. Nombre y fecha de nacimiento viajan en los
 * metadatos del registro, y la base los copia a `profiles` con el disparador
 * de `supabase/migrations/`, que además rechaza a quien tenga menos de 18.
 */

export type AccountUser = {
  id: string;
  email: string;
  name: string;
  birthdate: string | null;
};

export type AccountState =
  /** Todavía no se sabe: el cliente está leyendo la sesión guardada. */
  | { status: "loading" }
  /** No hay proyecto configurado: la aplicación funciona solo como invitado. */
  | { status: "unavailable" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: AccountUser };

/** Resultado de una operación de cuenta: o sale, o trae el porqué traducible. */
export type AccountResult<T = void> =
  | ({ ok: true } & (T extends void ? unknown : { value: T }))
  | { ok: false; error: MessageKey };

const LOADING: AccountState = { status: "loading" };
const UNAVAILABLE: AccountState = { status: "unavailable" };
const SIGNED_OUT: AccountState = { status: "signed-out" };

let state: AccountState = IS_SUPABASE_CONFIGURED ? LOADING : UNAVAILABLE;
let started = false;
const listeners = new Set<() => void>();

function toUser(session: Session): AccountUser {
  const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: typeof metadata.full_name === "string" ? metadata.full_name : "",
    birthdate: typeof metadata.birthdate === "string" ? metadata.birthdate : null,
  };
}

function setState(next: AccountState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function fromSession(session: Session | null): AccountState {
  return session ? { status: "signed-in", user: toUser(session) } : SIGNED_OUT;
}

/**
 * Empieza a escuchar la sesión, una sola vez por pestaña. Se hace al primer
 * suscriptor y no al importar: así el cliente no se crea en pantallas que no
 * preguntan por la cuenta, y nunca en el servidor.
 */
function start(): void {
  if (started) return;
  const supabase = getSupabase();
  if (!supabase) return;
  started = true;

  supabase.auth.getSession().then(({ data }) => setState(fromSession(data.session)));
  supabase.auth.onAuthStateChange((_event, session) => setState(fromSession(session)));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

/** El estado de la cuenta, reactivo. En el servidor siempre es "cargando". */
export function useAccount(): AccountState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => (IS_SUPABASE_CONFIGURED ? LOADING : UNAVAILABLE),
  );
}

/**
 * Traduce un error de Supabase a una frase de la aplicación.
 *
 * Se decide por el `code`, que es estable, y no por el mensaje, que Supabase
 * cambia sin avisar. Lo que no se reconoce cae en un mensaje genérico: nunca
 * se le enseña a nadie un texto técnico en inglés en mitad de la pantalla.
 */
function describe(error: AuthError): MessageKey {
  // Sin red, `status` es 0 y no hay código: el servidor ni llegó a contestar.
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return "authErrorNetwork";
  }

  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "authErrorEmailTaken";
    case "weak_password":
      return "authErrorPasswordWeak";
    case "email_address_invalid":
      return "authErrorEmailInvalid";
    // El correo de prueba de Supabase solo envía a los miembros del proyecto.
    // Con un SMTP propio configurado esto deja de pasar.
    case "email_address_not_authorized":
      return "authErrorEmailUndeliverable";
    case "invalid_credentials":
      return "authErrorInvalidCredentials";
    case "email_not_confirmed":
      return "authErrorEmailNotConfirmed";
    case "same_password":
      return "authErrorSamePassword";
    // Supabase no distingue un código mal escrito de uno caducado: los dos
    // llegan como `otp_expired`, y la salida es la misma, pedir otro.
    case "otp_expired":
      return "authErrorCodeInvalid";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "authErrorRateLimit";
    case "signup_disabled":
      return "authErrorSignupDisabled";
    // El disparador de `profiles` rechaza el alta de un menor con una
    // excepción, y Supabase la entrega como `unexpected_failure`, igual que
    // cualquier otro fallo de la base. No se puede distinguir, así que cae en
    // el genérico: la edad ya la comprueba la pantalla antes de enviar, y
    // decir "eres menor" por una base mal configurada sería mentir.
    default:
      return "authErrorGeneric";
  }
}

function unavailable(): { ok: false; error: MessageKey } {
  return { ok: false, error: "accountsComingSoonForm" };
}

/** Dirección absoluta dentro de esta misma aplicación, para los enlaces del correo. */
function here(path: string): string {
  return `${window.location.origin}${path}`;
}

export type SignUpInput = {
  name: string;
  /** ISO corto, `YYYY-MM-DD`. */
  birthdate: string;
  email: string;
  password: string;
  language: Language;
};

/**
 * Crea la cuenta. Con la confirmación por correo activada —lo normal— no hay
 * sesión hasta que se escribe el código del correo (`verifyEmailCode`), y
 * `needsConfirmation` lo dice. El `emailRedirectTo` se queda para los correos
 * con enlace que ya se enviaron antes de pasar al código. Si el
 * proyecto la tuviera desactivada, se entra directamente.
 *
 * Con la confirmación activada Supabase no avisa de que el correo ya existe
 * (para no revelar quién tiene cuenta): devuelve un usuario sin identidades y
 * no envía nada. Se trata igual que un alta, y la pantalla de "revisa tu
 * correo" ofrece iniciar sesión por si acaso.
 */
export async function signUp(
  input: SignUpInput,
): Promise<AccountResult<{ needsConfirmation: boolean }>> {
  const supabase = getSupabase();
  if (!supabase) return unavailable();

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: here(AUTH_CALLBACK),
      data: {
        full_name: input.name.trim(),
        birthdate: input.birthdate,
        language: input.language,
      },
    },
  });

  if (error) return { ok: false, error: describe(error) };
  return { ok: true, value: { needsConfirmation: !data.session } };
}

/** Vuelve a enviar el correo de confirmación de un alta. */
export async function resendConfirmation(email: string): Promise<AccountResult> {
  const supabase = getSupabase();
  if (!supabase) return unavailable();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: here(AUTH_CALLBACK) },
  });

  return error ? { ok: false, error: describe(error) } : { ok: true };
}

/**
 * Activa la cuenta con el código que llega por correo y abre la sesión.
 *
 * Es la forma principal de confirmar el alta, y no el enlace: un enlace se
 * abre donde quiera el lector de correo —en el teléfono, casi siempre dentro
 * de su propio navegador— y la sesión se quedaba ahí, así que luego había que
 * volver a entrar en la aplicación. El código se escribe en la misma pantalla
 * que lo pidió y la sesión queda donde se está jugando, también dentro de la
 * aplicación de tienda.
 */
export async function verifyEmailCode(email: string, code: string): Promise<AccountResult> {
  const supabase = getSupabase();
  if (!supabase) return unavailable();

  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: "email",
  });

  return error ? { ok: false, error: describe(error) } : { ok: true };
}

export async function signIn(email: string, password: string): Promise<AccountResult> {
  const supabase = getSupabase();
  if (!supabase) return unavailable();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  return error ? { ok: false, error: describe(error) } : { ok: true };
}

/**
 * Envía el enlace para cambiar la contraseña. Supabase contesta igual exista
 * o no la cuenta, y la pantalla también: decir "ese correo no existe" le
 * contaría a cualquiera quién está registrado.
 */
export async function sendPasswordReset(email: string): Promise<AccountResult> {
  const supabase = getSupabase();
  if (!supabase) return unavailable();

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: here(RESET_PASSWORD),
  });

  return error ? { ok: false, error: describe(error) } : { ok: true };
}

/** Cambia la contraseña de la sesión abierta (la que trae el enlace del correo). */
export async function updatePassword(password: string): Promise<AccountResult> {
  const supabase = getSupabase();
  if (!supabase) return unavailable();

  const { error } = await supabase.auth.updateUser({ password });
  return error ? { ok: false, error: describe(error) } : { ok: true };
}

/**
 * Cierra la sesión en este dispositivo. El progreso, el perfil y las
 * preferencias se quedan: viven en sus propias claves y no son la cuenta.
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut({ scope: "local" });
}
