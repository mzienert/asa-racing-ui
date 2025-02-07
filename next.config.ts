import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Required for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;