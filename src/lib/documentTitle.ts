"use client";

import { useEffect } from "react";
import { siteName } from "@/app/siteMetadata";

/**
 * El título de la pestaña, en el idioma de la interfaz.
 *
 * La metadata de cada ruta es estática y se sirve en inglés, que es el idioma
 * por defecto y el que tiene que ver quien comparte un enlace o lo rastrea. Pero
 * el idioma se elige en el dispositivo y vive en `localStorage`, así que el
 * servidor no puede saberlo: sin esto, jugar en español dejaba la pestaña
 * diciendo "Coloring · BIntuitive" mientras el juego decía Colorear, y el
 * nombre de la ventana es lo que se lee en el gestor de pestañas, en el
 * historial y al guardar un atajo.
 *
 * El `<title>` no es nuestro: lo renderiza Next desde la metadata de la ruta y
 * lo vuelve a aplicar en cuanto algo de la página se vuelve a renderizar —abrir
 * el menú de ajustes bastaba para devolver la pestaña al inglés—. Por eso no
 * vale asignarlo una vez: hay que reafirmarlo cada vez que otro lo pisa, y eso
 * es justo lo que hace el observador. La comprobación `!==` es la que corta el
 * bucle, porque nuestra propia escritura también dispara el observador.
 *
 * Solo corrige el título. El `lang` del documento ya lo sigue
 * `LanguageProvider`, y la descripción se queda en inglés a propósito, igual que
 * el manifest: es una sola cadena que se lee fuera de la aplicación, donde no
 * hay idioma elegido. Quien llame a esto le pasa el nombre ya traducido —el que
 * el juego o la pantalla ya tiene en la mano—, así que aquí no hay ninguna tabla
 * de rutas que mantener al día.
 */
export function useDocumentTitle(name: string) {
  useEffect(() => {
    if (!name) return;

    const wanted = `${name} · ${siteName}`;
    const apply = () => {
      if (document.title !== wanted) document.title = wanted;
    };

    apply();

    // El nodo se busca en el documento entero y no en `document.head`: Next
    // sirve la metadata dentro del `<body>` —el navegador la respeta igual— y
    // un observador atado a la cabecera no vería nunca lo que la pisa.
    const node = document.querySelector("title");
    if (!node) return;

    const observer = new MutationObserver(apply);
    observer.observe(node, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [name]);
}
