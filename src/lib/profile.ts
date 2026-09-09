import type { Language } from "./language";

const PROFILE_KEY = "bintuitive-profile";

/**
 * Quién juega en este dispositivo.
 *
 * Es identidad local, no una cuenta: no hay servidor, ni correo, ni
 * contraseña, y nada de esto sale del navegador. La pantalla de perfil lo dice
 * en voz alta para que nadie espere iniciar sesión.
 *
 * Vive en su propia clave, aparte del progreso (`bintuitive-progress`) y de
 * las preferencias: borrar el progreso no borra a la persona, y elegir otro
 * avatar no toca las estrellas.
 */
export type Profile = {
  name: string;
  /**
   * Id del avatar, no su emoji: el dibujo puede cambiar de una versión a otra
   * y quien ya eligió zorro debe seguir teniendo zorro.
   */
  avatarId: string;
  /** Desde cuándo juega, en ISO (`YYYY-MM-DD`). */
  since: string;
};

export type ProfileAvatar = {
  id: string;
  emoji: string;
  /** Los nombres viven aquí, bilingües, como los demás datos con nombre. */
  name: Record<Language, string>;
};

export const PROFILE_AVATARS: ProfileAvatar[] = [
  { id: "bee", emoji: "🐝", name: { en: "Bee", es: "Abeja" } },
  { id: "fox", emoji: "🦊", name: { en: "Fox", es: "Zorro" } },
  { id: "koala", emoji: "🐨", name: { en: "Koala", es: "Koala" } },
  { id: "lion", emoji: "🦁", name: { en: "Lion", es: "León" } },
  { id: "panda", emoji: "🐼", name: { en: "Panda", es: "Panda" } },
  { id: "frog", emoji: "🐸", name: { en: "Frog", es: "Rana" } },
  { id: "unicorn", emoji: "🦄", name: { en: "Unicorn", es: "Unicornio" } },
  { id: "octopus", emoji: "🐙", name: { en: "Octopus", es: "Pulpo" } },
];

/** La abeja, que es la de la marca. */
export const DEFAULT_AVATAR_ID = PROFILE_AVATARS[0].id;

/**
 * Un nombre corto cabe en la cabecera del perfil a cualquier tamaño de letra.
 * No es una validación de nada: nadie inicia sesión con esto.
 */
export const PROFILE_NAME_MAX_LENGTH = 20;

export function getAvatar(id: string): ProfileAvatar {
  return (
    PROFILE_AVATARS.find((avatar) => avatar.id === id) ?? PROFILE_AVATARS[0]
  );
}

/** Hoy en ISO corto, en la zona del dispositivo y no en UTC. */
export function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function normalize(
  stored: Partial<Profile> | undefined,
  since: string,
): Profile {
  const name = typeof stored?.name === "string" ? stored.name.trim() : "";

  return {
    name: name.slice(0, PROFILE_NAME_MAX_LENGTH),
    avatarId: getAvatar(
      typeof stored?.avatarId === "string" ? stored.avatarId : "",
    ).id,
    since:
      typeof stored?.since === "string" &&
      !Number.isNaN(Date.parse(stored.since))
        ? stored.since
        : since,
  };
}

/**
 * Lee el perfil de este dispositivo y lo estrena si todavía no existe.
 *
 * `startedOn` es la fecha que se guarda la primera vez. Quien ya jugaba antes
 * de que existiera esta pantalla pasa la fecha de su sesión más antigua, para
 * que "jugando desde" no diga que empezó hoy.
 */
export function ensureProfile(startedOn: string): Profile {
  if (typeof window === "undefined") return normalize(undefined, startedOn);

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (raw) return normalize(JSON.parse(raw) as Partial<Profile>, startedOn);
  } catch {
    // Guardado ilegible: se estrena uno nuevo encima.
  }

  const fresh = normalize(undefined, startedOn);
  saveProfile(fresh);
  return fresh;
}

export function saveProfile(profile: Profile): void {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Sin almacenamiento el perfil dura lo que la pestaña, y no pasa nada.
  }
}
