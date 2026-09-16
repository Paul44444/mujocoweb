#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
URL="${1:-}"

if [[ ! "$URL" =~ ^https://[a-z0-9-]+\.trycloudflare\.com/?$ ]]; then
    printf 'Usage: %s https://your-quick-tunnel.trycloudflare.com\n' "$0" >&2
    exit 2
fi

cd "$ROOT"
if [[ -n "$(git status --porcelain -- public/backend.json)" ]]; then
    printf 'public/backend.json has uncommitted changes; review them before publishing.\n' >&2
    exit 1
fi

URL="${URL%/}"
printf '{"url":"%s"}\n' "$URL" > public/backend.json
git add -- public/backend.json
if git diff --cached --quiet -- public/backend.json; then
    printf 'This tunnel URL is already published.\n'
    exit 0
fi

git commit -m "Point frontend to current test tunnel" -- public/backend.json
git push origin main
printf 'Published %s. Wait for Vercel to finish deploying.\n' "$URL"
