import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/categorias",
        destination: "/worlds",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
