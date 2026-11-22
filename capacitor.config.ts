import type { CapacitorConfig } from "@capacitor/cli";

/**
 * La app de tienda: el build estático de BIntuitive (`out/`, ver
 * `next.config.ts` y `npm run build:store`) dentro de una app nativa.
 *
 * `appId` es el identificador de la app en Google Play y en el App Store, y
 * **no se puede cambiar después de publicar**: una app con otro id es otra app
 * distinta, con otra ficha y sin sus descargas. Va al revés del dominio de la
 * empresa, que es la convención de las dos tiendas.
 *
 * Los archivos viajan dentro de la app (no se carga la web desde internet):
 * así se juega sin conexión y Apple no la toma por una web empaquetada.
 */
const config: CapacitorConfig = {
  appId: "com.aumcrsp.bintuitive",
  appName: "BIntuitive",
  webDir: "out",
  // El crema de la aplicación detrás de todo, para que al abrir no se vea un
  // fogonazo blanco antes de que cargue la primera pantalla.
  backgroundColor: "#f5f4ee",
};

export default config;
