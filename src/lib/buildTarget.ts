/**
 * Para dónde se construye la aplicación: la web o las tiendas.
 *
 * El build de tienda (App Store y Google Play) se hace con
 * `NEXT_PUBLIC_BUILD_TARGET=store`. Next escribe el valor dentro del código al
 * compilar, así que no se puede cambiar después sin volver a construir.
 *
 * La diferencia hoy es una sola: la tienda no enseña iniciar sesión ni crear
 * cuenta. En la web son prototipos que dicen que todavía no funcionan, y es
 * una forma honesta de enseñar lo que viene; en una tienda, una función que no
 * funciona es motivo de rechazo en la revisión. Cuando existan cuentas de
 * verdad, esta excepción desaparece.
 */
export const IS_STORE_BUILD = process.env.NEXT_PUBLIC_BUILD_TARGET === "store";
