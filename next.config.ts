import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
    ];
  },
};

export default nextConfig;
