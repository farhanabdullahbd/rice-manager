#!/bin/bash
# Render.com এ চালানোর জন্য build script
set -e

echo "Installing backend dependencies..."
cd backend
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding initial data..."
node prisma/seed.js || echo "Seed already done, skipping..."

echo "Build complete!"
