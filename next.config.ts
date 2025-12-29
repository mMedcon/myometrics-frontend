import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/myometrics-frontend',
  
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
