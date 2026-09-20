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
      // "/" es la portada pública y no redirige a ningún sitio. El panal vive
      // ahora en `/explore`, así que las direcciones antiguas que llevaban a un
      // índice de juegos apuntan allí: quien guardó uno de esos enlaces quería
      // el panal, no una pantalla de registro.
      //
      // `/hexagons` sigue SIN redirigir: sirve la misma pantalla con un 200.
      // Durante meses "/" devolvió un 308 permanente hacia `/hexagons` y ese
      // salto sigue en la caché del navegador de quien ya abrió la aplicación;
      // darle la vuelta encadenaría "/" guardado → `/hexagons` → "/" y el
      // navegador cortaría con "demasiadas redirecciones". Quien tenga ese
      // salto en la caché entra directo al panal sin ver la portada, que es el
      // mal menor: ya es alguien que juega. Ver `src/app/hexagons/page.tsx`.
      {
        source: "/categorias",
        destination: "/explore",
        permanent: true,
      },
      {
        source: "/worlds",
        destination: "/explore",
        permanent: true,
      },
      // La sección "games" se absorbió en el panal: el índice va a la raíz y
      // cada juego conserva su enlace bajo la ruta de juego singular.
      {
        source: "/games",
        destination: "/explore",
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
