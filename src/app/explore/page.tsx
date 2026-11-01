import type { Metadata } from "next";
import HomeClient from "../HomeClient";

/**
 * El panal: la pantalla de entrada de la aplicación.
 *
 * Vivía en la raíz hasta que la raíz pasó a ser la portada pública. Todo lo
 * que dentro de la aplicación significa "volver al principio" —la casa de los
 * juegos, el botón de los resultados, la pestaña de la barra— apunta aquí y no
 * a `/`, que ahora lleva a la pantalla de registro. Las direcciones están en
 * `src/lib/routes.ts` para no escribirlas sueltas.
 */
/*
 * "Home" y no "Explore": la ruta se llama `/explore` por su historia, pero la
 * pestaña que lleva aquí se llama Home en inglés e Inicio en español, y el
 * título de la ventana tiene que decir lo mismo que la pestaña que se acaba de
 * pulsar. El cliente lo traduce al idioma elegido; esto es lo que se sirve.
 */
export const metadata: Metadata = {
  title: "Home · BIntuitive",
};

export default function ExplorePage() {
  return <HomeClient />;
}
