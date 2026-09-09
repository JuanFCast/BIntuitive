import type { Metadata } from "next";
import HomeClient from "../HomeClient";
import { siteUrl } from "../siteMetadata";

/**
 * La direccion anterior del panal, que sigue sirviendo la misma pantalla.
 *
 * No redirige a `/` a proposito. Durante meses `/` devolvio un 308 permanente
 * hacia aqui, y ese salto vive en la cache del navegador de cualquiera que ya
 * haya abierto la aplicacion: darle la vuelta ahora encadenaria `/` guardado →
 * `/hexagons` → `/` y el navegador cortaria con "demasiadas redirecciones".
 * Sirviendo la pagina con un 200, quien llegue con el salto viejo en la cache
 * ve la aplicacion igual, y `canonical` manda a los buscadores a la raiz.
 */
// Sin `title` propio: es la misma pantalla que la raiz, asi que hereda el
// nombre del sitio del layout en vez de inventarse otro.
export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
};

export default function HexagonsPage() {
  return <HomeClient />;
}
