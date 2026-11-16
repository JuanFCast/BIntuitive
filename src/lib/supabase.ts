import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * El cliente de Supabase, el único sitio donde se crea.
 *
 * Las dos variables son públicas a propósito: la URL del proyecto y la clave
 * `anon` (o *publishable*) van dentro de la aplicación y lo que protege los
 * datos son las políticas RLS de la base, no que la clave sea secreta. La
 * `service_role` no entra **nunca** aquí: con ella cualquiera se saltaría
 * esas políticas.
 *
 * Se escriben literales (`process.env.NEXT_PUBLIC_…`) porque Next solo las
 * sustituye al compilar si las encuentra escritas así; leídas por un nombre
 * calculado llegarían vacías al navegador.
 *
 * Sin las dos variables la aplicación sigue funcionando entera como
 * invitado: un build sin configurar —Vercel, la tienda, la máquina de alguien
 * que acaba de clonar— no se rompe, solo enseña que las cuentas aún no están.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const IS_SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Dónde guarda la sesión el cliente. Clave propia, como el resto: borrar el
 * progreso (`clearProgress`) no cierra la sesión, y cerrar la sesión no borra
 * el progreso.
 */
const AUTH_STORAGE_KEY = "bintuitive-auth";

let client: SupabaseClient | null = null;

/**
 * El cliente, o `null` si no hay proyecto configurado o se está renderizando
 * en el servidor. Todas las pantallas son de cliente y el build es estático,
 * así que la sesión vive en el navegador y no hace falta nada de servidor.
 */
export function getSupabase(): SupabaseClient | null {
  if (!IS_SUPABASE_CONFIGURED || typeof window === "undefined") return null;

  client ??= createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Los enlaces del correo (confirmar la cuenta, cambiar la contraseña)
      // vuelven con la sesión en la dirección, y el cliente la recoge solo.
      detectSessionInUrl: true,
      storageKey: AUTH_STORAGE_KEY,
    },
  });

  return client;
}
