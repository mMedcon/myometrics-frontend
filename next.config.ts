import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable GitHub Pages deployment
  basePath: process.env.NODE_ENV === 'production' ? '/myometrics-frontend' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/myometrics-frontend/' : '',
  trailingSlash: true,
  
  images: {
    unoptimized: true,
  },
  
  // Temporarily disable static export for testing
  // output: 'export',
};

export default nextConfig;
