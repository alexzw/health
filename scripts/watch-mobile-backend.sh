#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
BACKEND_LOG="$RUNTIME_DIR/backend.log"
TUNNEL_LOG="$RUNTIME_DIR/cloudflared-watch.log"
STATE_FILE="$RUNTIME_DIR/current-api-url.txt"
CHECK_INTERVAL="${MOBILE_WATCH_INTERVAL:-20}"

mkdir -p "$RUNTIME_DIR"

cleanup() {
  if [[ -n "${TUNNEL_PID:-}" ]] && kill -0 "$TUNNEL_PID" >/dev/null 2>&1; then
    kill "$TUNNEL_PID" >/dev/null 2>&1 || true
  fi

  if [[ "${STARTED_BACKEND:-0}" == "1" ]] && [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

STARTED_BACKEND=0

ensure_backend() {
  if curl -fsS http://127.0.0.1:4000/health >/dev/null 2>&1; then
    return
  fi

  npm run start:backend >"$BACKEND_LOG" 2>&1 &
  BACKEND_PID=$!
  STARTED_BACKEND=1

  for _ in {1..30}; do
    if curl -fsS http://127.0.0.1:4000/health >/dev/null 2>&1; then
      return
    fi
    sleep 1
  done

  echo "Backend did not become ready on port 4000."
  exit 1
}

extract_public_url() {
  perl -ne 'print "$1\n" if /(https:\/\/[a-z0-9.-]+\.trycloudflare\.com)/i' "$1" | tail -n1
}

sync_and_redeploy() {
  local api_base_url="$1"

  echo "$api_base_url" >"$STATE_FILE"
  bash "$ROOT_DIR/scripts/deploy-mobile-frontend.sh" "$api_base_url"
}

while true; do
  ensure_backend

  rm -f "$TUNNEL_LOG"
  npx cloudflared tunnel --url http://127.0.0.1:4000 --no-autoupdate >"$TUNNEL_LOG" 2>&1 &
  TUNNEL_PID=$!

  PUBLIC_URL=""
  for _ in {1..30}; do
    if [[ -f "$TUNNEL_LOG" ]]; then
      PUBLIC_URL="$(extract_public_url "$TUNNEL_LOG")"
    fi

    if [[ -n "$PUBLIC_URL" ]]; then
      break
    fi
    sleep 1
  done

  if [[ -z "$PUBLIC_URL" ]]; then
    echo "Cloudflare quick tunnel did not become ready. Retrying..."
    if kill -0 "$TUNNEL_PID" >/dev/null 2>&1; then
      kill "$TUNNEL_PID" >/dev/null 2>&1 || true
    fi
    sleep 2
    continue
  fi

  API_BASE_URL="${PUBLIC_URL%/}/api/v1"
  LAST_API_URL="$(cat "$STATE_FILE" 2>/dev/null || true)"

  echo
  echo "Tunnel ready: $PUBLIC_URL"
  echo "API base: $API_BASE_URL"

  if [[ "$API_BASE_URL" != "$LAST_API_URL" ]]; then
    echo "API URL changed, syncing Vercel and redeploying frontend..."
    sync_and_redeploy "$API_BASE_URL"
  else
    echo "API URL unchanged, keeping current Vercel deployment."
  fi

  while true; do
    sleep "$CHECK_INTERVAL"

    if ! kill -0 "$TUNNEL_PID" >/dev/null 2>&1; then
      echo "Tunnel process exited. Restarting..."
      break
    fi

    if ! curl -fsS "$PUBLIC_URL/health" >/dev/null 2>&1; then
      echo "Tunnel health check failed. Restarting..."
      kill "$TUNNEL_PID" >/dev/null 2>&1 || true
      break
    fi
  done
done
