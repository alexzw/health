#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
BACKEND_LOG="$RUNTIME_DIR/backend.log"
TUNNEL_LOG="$RUNTIME_DIR/cloudflared.log"

mkdir -p "$RUNTIME_DIR"

cleanup() {
  if [[ -n "${LT_PID:-}" ]] && kill -0 "$LT_PID" >/dev/null 2>&1; then
    kill "$LT_PID" >/dev/null 2>&1 || true
  fi

  if [[ "${STARTED_BACKEND:-0}" == "1" ]] && [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

STARTED_BACKEND=0

if ! curl -s http://127.0.0.1:4000/health >/dev/null 2>&1; then
  npm run start:backend >"$BACKEND_LOG" 2>&1 &
  BACKEND_PID=$!
  STARTED_BACKEND=1

  for _ in {1..30}; do
    if curl -s http://127.0.0.1:4000/health >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

if ! curl -s http://127.0.0.1:4000/health >/dev/null 2>&1; then
  echo "Backend did not become ready on port 4000."
  exit 1
fi

LT_ARGS=(--port 4000)

rm -f "$TUNNEL_LOG"
npx cloudflared tunnel --url http://127.0.0.1:4000 --no-autoupdate >"$TUNNEL_LOG" 2>&1 &
LT_PID=$!

PUBLIC_URL=""
for _ in {1..30}; do
  if [[ -f "$TUNNEL_LOG" ]]; then
    PUBLIC_URL="$(perl -ne 'print "$1\n" if /(https:\/\/[a-z0-9.-]+\.trycloudflare\.com)/i' "$TUNNEL_LOG" | tail -n1)"
  fi

  if [[ -n "$PUBLIC_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "Cloudflare quick tunnel did not return a public URL."
  exit 1
fi

API_BASE_URL="${PUBLIC_URL%/}/api/v1"

echo
echo "Backend health: http://127.0.0.1:4000/health"
echo "Public backend URL: $PUBLIC_URL"
echo "Public API base URL: $API_BASE_URL"
echo
echo "To sync Vercel env automatically, run:"
echo "bash scripts/sync-vercel-api-url.sh $API_BASE_URL"
echo
echo "To redeploy the frontend with the synced env, run:"
echo "bash scripts/deploy-mobile-frontend.sh $API_BASE_URL"
echo
echo "For automatic recovery when the tunnel changes, run:"
echo "bash scripts/watch-mobile-backend.sh"
echo
echo "Logs:"
echo "- Backend: $BACKEND_LOG"
echo "- Tunnel:  $TUNNEL_LOG"
echo
echo "Press Ctrl+C to stop the mobile backend session."

wait "$LT_PID"
