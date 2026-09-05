import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "beesmart.aumcrsp.com",
          },
        ],
        destination: "https://bintuitive.aumcrsp.com/:path*",
        permanent: true,
      },
      // El panal es la pantalla de entrada y vive en la raíz, así que "/" ya no
      // redirige a ningún sitio. `/hexagons` tampoco redirige aquí: sirve la
      // misma pantalla con un 200. Durante meses "/" devolvió un 308 permanente
      // hacia `/hexagons` y ese salto sigue en la caché del navegador de quien
      // ya abrió la aplicación; darle la vuelta encadenaría "/" guardado →
      // `/hexagons` → "/" y el navegador cortaría con "demasiadas
      // redirecciones". Ver `src/app/hexagons/page.tsx`.
      {
        source: "/categorias",
        destination: "/",
        permanent: true,
      },
      {
        source: "/worlds",
        destination: "/",
        permanent: true,
      },
      // La sección "games" se absorbió en el panal: el índice va a la raíz y
      // cada juego conserva su enlace bajo la ruta de juego singular.
      {
        source: "/games",
        destination: "/",
        permanent: true,
      },
      // El juego se llamaba "Word Puzzle" antes de distinguirlo de la futura
      // sopa de letras. Las dos rutas anteriores llegan al destino en un solo
      // salto, por eso esta regla va antes de la genérica de /games.
      {
        source: "/games/word-puzzle",
        destination: "/game/word-scramble",
        permanent: true,
      },
      {
        source: "/games/:path+",
        destination: "/game/:path+",
        permanent: true,
      },
      {
        source: "/game/word-puzzle",
        destination: "/game/word-scramble",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
