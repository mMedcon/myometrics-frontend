#!/bin/bash
# Build script for GitHub Pages deployment

echo "Building Next.js application..."
npm run build

echo "Creating out directory for GitHub Pages..."
mkdir -p out
cp -r .next/static out/
cp -r .next/server out/
cp .next/standalone/server.js out/ 2>/dev/null || echo "No standalone server.js found"

echo "Creating index.html for GitHub Pages..."
echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MyoMetrics</title>
    <meta http-equiv="refresh" content="0;url=/myometrics-frontend/">
</head>
<body>
    <p>Redirecting to MyoMetrics...</p>
</body>
</html>' > out/index.html

echo "Build complete! Contents of out directory:"
ls -la out/