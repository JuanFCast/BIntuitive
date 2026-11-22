/**
 * Las direcciones de la aplicación, escritas una sola vez.
 *
 * Existen aquí por un motivo concreto: la raíz dejó de ser el panal. Ahora es
 * la portada pública, y todos los botones de casa, salida y "volver al
 * principio" de dentro de la aplicación tienen que llevar a `EXPLORE`, no a
 * `/`. Un `href="/"` suelto en un juego mandaría a quien juega a la pantalla de
 * registro en mitad de una partida, y ese error no lo ve el compilador.
 *
 * `LEGACY_EXPLORE` sigue sirviendo el panal con un 200 y **no redirige**, ni
 * debe hacerlo. Durante meses `/` devolvió un 308 permanente hacia ella y ese
 * salto vive en la caché del navegador de quien ya abrió la aplicación: quien
 * lo tenga guardado entra por ahí sin pasar por la red. Si `/hexagons`
 * redirigiera a la raíz, esa caché cerraría el ciclo `/` → `/hexagons` → `/` y
 * el navegador cortaría con "demasiadas redirecciones". Sirviéndola con un
 * 200, quien llegue con el salto viejo ve la aplicación igual.
 */
export const LANDING = "/";
export const EXPLORE = "/explore";
export const LEGACY_EXPLORE = "/hexagons";
export const PROGRESS = "/progress";
export const PROFILE = "/profile";
export const SIGN_IN = "/signin";
export const SIGN_UP = "/signup";
export const FORGOT_PASSWORD = "/forgot-password";
/** Adonde vuelve el enlace de confirmación del correo de alta. */
export const AUTH_CALLBACK = "/auth/callback";
/** Adonde vuelve el enlace del correo de "olvidé mi contraseña". */
export const RESET_PASSWORD = "/reset-password";
/**
 * Las dos páginas legales. Públicas en la web y en el build de tienda: Apple y
 * Google exigen enlazarlas en la ficha y dentro de la aplicación. La sección
 * de borrar la cuenta tiene ancla propia (`/privacy#delete`), que es la URL que
 * pide Google Play para explicar cómo borrarla.
 */
export const PRIVACY = "/privacy";
export const TERMS = "/terms";

/** Las que llevan el marco de la aplicación: cabecera y barra inferior. */
export const APP_FRAME_ROUTES = [
  EXPLORE,
  LEGACY_EXPLORE,
  PROGRESS,
  PROFILE,
] as const;
