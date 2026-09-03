import type { MetadataRoute } from "next";
import { siteDescription, siteName } from "./siteMetadata";

/**
 * Manifest de la aplicación instalable.
 *
 * Next lo sirve en `/manifest.webmanifest` y enlaza él mismo el `<link>` en el
 * documento, así que no hay que escribir ninguna etiqueta a mano. Al estar
 * tipado como `MetadataRoute.Manifest`, `tsc` valida su forma en cada build.
 *
 * El manifest es un archivo estático y el idioma de la aplicación se elige en
 * el dispositivo, así que no puede seguirlo: va en inglés, que es el idioma por
 * defecto de la interfaz y el de la metadata que ya se comparte. La aplicación
 * sigue siendo bilingüe en cuanto se abre.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Identidad estable de la aplicación instalada. Se declara aparte de
    // `start_url` para que mañana se pueda cambiar por dónde entra sin que el
    // navegador la tome por una aplicación distinta.
    id: "/",
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    lang: "en",
    dir: "ltr",
    // Explore es la entrada y vive en /hexagons. Arrancar en "/" costaría un
    // redirect en cada apertura desde el icono.
    start_url: "/hexagons",
    scope: "/",
    display: "standalone",
    // Los colores de la marca: crema es el fondo de la aplicación, así que la
    // pantalla de arranque no da un salto de color al entrar.
    background_color: "#f7f4ea",
    theme_color: "#ffc400",
    // Sin `orientation`: el panal está pensado para el alto en el teléfono y
    // para el ancho en la tableta, y fijar una obligaría a la peor de las dos.
    // Ninguno se marca `maskable`: el logo llega cerca del borde y las esquinas
    // del azulejo son transparentes, así que una máscara circular le cortaría
    // el birrete. Sin la marca, Android lo encuadra en vez de recortarlo.
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        // El mismo archivo que Next sirve como favicon desde `app/icon.png`:
        // el icono grande existe una sola vez en el repositorio.
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
