import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === '1';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // Configure based on deployment platform
  ...(isGitHubPages && {
    // GitHub Pages specific configuration
    basePath: '/myometrics-frontend',
    assetPrefix: '/myometrics-frontend/',
    trailingSlash: true,
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),
  
  ...(isVercel && {
    // Vercel specific configuration (supports dynamic routes)
    images: {
      domains: ['myometrics-backend.onrender.com', 'dicom-ar4z.onrender.com'],
    },
  }),
  
  // Default configuration for local development
  ...(!isVercel && !isGitHubPages && {
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
