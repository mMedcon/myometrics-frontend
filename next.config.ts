import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/myometrics-frontend',
  // Temporarily disable static export due to dynamic routes
  // output: 'export',
  outputFileTracingRoot: __dirname,
  
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
