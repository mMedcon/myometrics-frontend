import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable GitHub Pages deployment
  basePath: '/myometrics-frontend',
  assetPrefix: '/myometrics-frontend/',
  trailingSlash: true,
  
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
