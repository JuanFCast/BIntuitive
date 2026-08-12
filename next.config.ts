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
    ];
  },
};

export default nextConfig;
