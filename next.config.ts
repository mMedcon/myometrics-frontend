import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable GitHub Pages deployment
  basePath: process.env.NODE_ENV === 'production' ? '/myometrics-frontend' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/myometrics-frontend/' : '',
  trailingSlash: true,
  
  images: {
    unoptimized: true,
  },
  
  // Enable static export for production deployment
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
};

export default nextConfig;
