import HomeClient from "./HomeClient";

/*
 * El panal es la pantalla de entrada y vive en la raiz: la direccion que se
 * comparte y se teclea es `https://bintuitive.aumcrsp.com`, sin nada detras.
 *
 * El titulo se hereda del layout —el nombre del sitio a secas—, que es lo que
 * quiere ver quien guarda esta pagina en marcadores.
 */
export default function HomePage() {
  return <HomeClient />;
}
