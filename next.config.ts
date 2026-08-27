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
      {
        source: "/categorias",
        destination: "/hexagons",
        permanent: true,
      },
      {
        source: "/worlds",
        destination: "/hexagons",
        permanent: true,
      },
      // La sección "games" se absorbió en Explore: el índice va al panal y
      // cada juego conserva su enlace bajo la ruta de juego singular.
      {
        source: "/games",
        destination: "/hexagons",
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
