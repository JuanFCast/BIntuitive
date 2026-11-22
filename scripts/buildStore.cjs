/*
 * Construye el build de tienda: el que va dentro de la app de Android y de iOS.
 *
 * Existe porque `NEXT_PUBLIC_BUILD_TARGET=store next build` no funciona igual
 * en todos los sistemas (en Windows, npm lanza los scripts con cmd.exe, que no
 * entiende esa forma de poner una variable). Aquí se pone la variable y se
 * lanza el build de Next, que con ella exporta la app estática en `out/`
 * (ver `next.config.ts`).
 *
 * Se usa con `npm run build:store`; `npm run app:sync` además copia `out/` al
 * proyecto de Android con Capacitor.
 */
const { spawnSync } = require("child_process");

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_BUILD_TARGET: "store" },
});

process.exit(result.status ?? 1);
