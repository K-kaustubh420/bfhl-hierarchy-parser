import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/bfhl",
        destination: "/api/bfhl",
      },
    ];
  },

};

export default nextConfig;
