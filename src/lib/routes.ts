/**
 * Las direcciones de la aplicación, escritas una sola vez.
 *
 * Existen aquí por un motivo concreto: la raíz dejó de ser el panal. Ahora es
 * la portada pública, y todos los botones de casa, salida y "volver al
 * principio" de dentro de la aplicación tienen que llevar a `EXPLORE`, no a
 * `/`. Un `href="/"` suelto en un juego mandaría al niño a la pantalla de
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

/** Las que llevan el marco de la aplicación: cabecera y barra inferior. */
export const APP_FRAME_ROUTES = [
  EXPLORE,
  LEGACY_EXPLORE,
  PROGRESS,
  PROFILE,
] as const;
