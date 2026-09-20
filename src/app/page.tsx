import LandingClient from "./LandingClient";

/*
 * La portada publica: lo primero que ve quien teclea el dominio.
 *
 * El panal se mudo a `/explore` y esta ruta paso a presentar BIntuitive y
 * ofrecer las tres puertas de entrada: iniciar sesion, crear una cuenta o
 * seguir como invitado. Las dos primeras son prototipos visuales honestos
 * —todavia no hay cuentas— y la tercera abre la aplicacion de siempre con el
 * progreso local intacto.
 *
 * El titulo se hereda del layout: el nombre del sitio a secas es exactamente
 * lo que quiere ver quien guarda esta direccion en marcadores.
 */
export default function LandingPage() {
  return <LandingClient />;
}
