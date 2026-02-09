#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Preparing development environment..."

ENV_LOCAL=".env.local"
ENV=".env"

# Pull Vercel env into .env.local
if command -v vercel >/dev/null 2>&1; then
  vercel env pull "$ENV_LOCAL" || echo "⚠ Vercel env pull failed"
else
  echo "⚠ Vercel CLI not found"
fi

# Ensure .env exists
touch "$ENV"

# Ensure AUTH_SECRET exists in .env
AUTH_SECRET=$(grep '^AUTH_SECRET=' "$ENV" | cut -d= -f2- || true)

if [ -z "$AUTH_SECRET" ]; then
  echo "🔐 Generating AUTH_SECRET in .env..."
  NEW_SECRET=$(openssl rand -base64 32)

  if grep -q '^AUTH_SECRET=' "$ENV"; then
    sed -i.bak "s|^AUTH_SECRET=.*|AUTH_SECRET=$NEW_SECRET|" "$ENV"
  else
    echo "AUTH_SECRET=$NEW_SECRET" >> "$ENV"
  fi

  rm -f "$ENV.bak"
else
  echo "✓ AUTH_SECRET already set in .env"
fi

echo "▶ Starting dev server..."
exec bun run next dev --turbopack
