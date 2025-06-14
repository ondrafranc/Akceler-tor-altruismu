#!/bin/bash
set -e

echo "Building SvelteKit app in subdirectory..."
cd akcelerator-landing-page
npm ci
npm run build

echo "Copying Vercel output to root level..."
cd ..
mkdir -p .vercel
cp -r akcelerator-landing-page/.vercel/output .vercel/

echo "Build completed successfully!"
ls -la .vercel/output/ 