import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/myometrics-frontend',
  output: 'export',
  outputFileTracingRoot: __dirname,
  
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
