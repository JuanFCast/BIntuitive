import type { Metadata } from "next";
import HomeClient from "../HomeClient";
import { siteUrl } from "../siteMetadata";
import { EXPLORE } from "@/lib/routes";

/**
 * Una direccion anterior del panal, que sigue sirviendo la misma pantalla.
 *
 * No redirige, y no debe empezar a hacerlo. Durante meses `/` devolvio un 308
 * permanente hacia aqui, y ese salto vive en la cache del navegador de
 * cualquiera que ya haya abierto la aplicacion: quien lo tenga guardado entra
 * por aqui sin pasar por la red. Si esta ruta redirigiera a la raiz se cerraria
 * el ciclo `/` guardado → `/hexagons` → `/` y el navegador cortaria con
 * "demasiadas redirecciones". Sirviendola con un 200 sigue viendo el panal.
 *
 * El `canonical` apunta ahora a `/explore`, que es donde vive de verdad el
 * panal desde que la raiz es la portada publica.
 */
export const metadata: Metadata = {
  title: "Explore · BIntuitive",
  alternates: { canonical: `${siteUrl}${EXPLORE}` },
};

export default function HexagonsPage() {
  return <HomeClient />;
}
