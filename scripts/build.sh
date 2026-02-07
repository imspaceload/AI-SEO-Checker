#!/bin/bash
# Resolve DATABASE_URL from multiple possible Vercel env var names
export DATABASE_URL="${DATABASE_URL:-${POSTGRES_PRISMA_URL:-${POSTGRES_URL:-${POSTGRES_URL_NON_POOLING:-postgresql://dummy:5432/placeholder}}}}"

echo "Running prisma generate..."
prisma generate

echo "Running prisma db push..."
prisma db push --skip-generate --accept-data-loss || echo "DB push skipped (no database connection)"

echo "Running next build..."
next build
