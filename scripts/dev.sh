#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Preparing development environment..."

ENV_LOCAL=".env.local"

# Pull Vercel env into .env.local
if command -v vercel >/dev/null 2>&1; then
  echo "📥 Pulling environment variables from Vercel..."
  vercel env pull "$ENV_LOCAL" || echo "⚠ Vercel env pull failed"
else
  echo "⚠ Vercel CLI not found - skipping env pull"
fi

echo "▶ Starting dev server..."
exec bun run next dev --turbopack