import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static export for now - dynamic routes are problematic
  // basePath: '/myometrics-frontend',
  // output: 'export',
  // outputFileTracingRoot: __dirname,
  trailingSlash: true,
  
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
