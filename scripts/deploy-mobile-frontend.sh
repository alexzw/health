#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
API_BASE_URL="${1:-}"

if [[ -z "$API_BASE_URL" ]]; then
  echo "Usage: bash scripts/deploy-mobile-frontend.sh <public-api-base-url>"
  echo "Example: bash scripts/deploy-mobile-frontend.sh https://example.loca.lt/api/v1"
  exit 1
fi

bash "$ROOT_DIR/scripts/sync-vercel-api-url.sh" "$API_BASE_URL"
echo
npx vercel deploy --prod --yes --cwd "$FRONTEND_DIR"
