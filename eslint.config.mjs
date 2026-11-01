import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

/*
 * Configuración de ESLint.
 *
 * El proyecto llevaba meses sin linter y eso dejó pasar cosas que nadie leyó:
 * dos carpetas de ruta vacías (`categorias`, `worlds`) que sobrevivieron a su
 * propio redirect, y una superficie duplicada de juegos que vivió meses. Nada
 * de eso rompe el build, así que `tsc` no lo iba a encontrar nunca.
 *
 * `eslint-config-next` todavía se escribe en el formato antiguo, así que se
 * traduce al formato plano con `FlatCompat`. Es lo que genera `create-next-app`
 * para Next 15; cuando el paquete publique su propia configuración plana, esto
 * se queda en un `import` y se pueden quitar las tres líneas de arriba.
 */
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    // Lo generado no se revisa: `.content-check/` es la salida de los seis
    // comandos de verificación y `.next/` la del build. `.claude/` tampoco:
    // son las skills de diseño, que están ignoradas por git porque son
    // herramienta y no código de BIntuitive, y traen miles de líneas propias.
    ignores: [
      ".next/**",
      ".content-check/**",
      ".claude/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      /*
       * Imports y variables sin usar son error, no aviso: son justo lo que se
       * quería detectar, y un aviso que no rompe nada se acumula hasta que ya
       * nadie lo lee. El guion bajo es la forma de decir "esto sobra a
       * propósito" —el parámetro que una firma obliga a declarar, el primer
       * elemento de un destructuring del que solo interesa el segundo—.
       */
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    /*
     * Los scripts de verificación corren en Node, no en el navegador, y usan
     * `console` para informar: es su única salida.
     */
    files: ["scripts/**/*.{js,cjs,mjs,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default config;
