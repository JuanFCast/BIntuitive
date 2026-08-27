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
      {
        source: "/games/:path+",
        destination: "/game/:path+",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
