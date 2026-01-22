import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/myometrics-frontend',
  // output: 'export', // Disable static export temporarily
  outputFileTracingRoot: __dirname,
  trailingSlash: true,
  
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
