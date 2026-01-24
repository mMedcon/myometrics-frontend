#!/bin/bash
# Build script for GitHub Pages deployment

echo "Building Next.js application with static export..."
npm run build

echo "Build complete! Next.js static export creates 'out' directory automatically."
echo "Contents of out directory:"
ls -la out/ || echo "Out directory not found - check build output above"