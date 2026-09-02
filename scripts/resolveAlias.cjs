/*
 * Resuelve el alias `@/` al ejecutar el validador ya compilado.
 *
 * `tsconfig.json` traduce `@/*` a `src/*` en tiempo de compilación, pero deja
 * el `require("@/data/questions")` tal cual en la salida, y Node no conoce ese
 * alias. Esto lo traduce a la carpeta compilada, que es exactamente lo que hace
 * el bundler en la aplicación. Se carga con `node -r`, sin dependencias.
 */
const path = require("node:path");
const Module = require("node:module");

const compiledSrc = path.join(__dirname, "..", ".content-check", "src");
const resolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith("@/")
    ? path.join(compiledSrc, request.slice(2))
    : request;
  return resolveFilename.call(this, target, ...rest);
};
