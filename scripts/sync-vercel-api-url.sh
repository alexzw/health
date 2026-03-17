#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
API_BASE_URL="${1:-}"

if [[ -z "$API_BASE_URL" ]]; then
  echo "Usage: bash scripts/sync-vercel-api-url.sh <public-api-base-url>"
  echo "Example: bash scripts/sync-vercel-api-url.sh https://example.loca.lt/api/v1"
  exit 1
fi

for environment in production development; do
  npx vercel env add NEXT_PUBLIC_API_BASE_URL "$environment" --value "$API_BASE_URL" --yes --force --cwd "$FRONTEND_DIR" >/dev/null
  echo "Updated NEXT_PUBLIC_API_BASE_URL for $environment -> $API_BASE_URL"
done

if [[ -n "${VERCEL_PREVIEW_BRANCH:-}" ]]; then
  npx vercel env add NEXT_PUBLIC_API_BASE_URL preview "$VERCEL_PREVIEW_BRANCH" --value "$API_BASE_URL" --yes --force --cwd "$FRONTEND_DIR" >/dev/null
  echo "Updated NEXT_PUBLIC_API_BASE_URL for preview branch $VERCEL_PREVIEW_BRANCH -> $API_BASE_URL"
fi

echo
echo "Vercel environment variables are now synced."
echo "Redeploy the frontend to apply them to a new production deployment."
