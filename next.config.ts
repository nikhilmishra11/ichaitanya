import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ichaitanya.com" }
    ]
  }
};

export default nextConfig;
