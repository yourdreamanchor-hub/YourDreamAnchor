#!/usr/bin/env bash
# Creates the tables in Supabase and loads the demo content (photos, reels, text) into it.
# Reads secrets from .env.supabase.local (git-ignored).
#   pnpm content:production   create tables, load content, then verify
#   pnpm verify:production    verify only
set -euo pipefail

ENV_FILE=".env.supabase.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

missing=()
[[ "${DATABASE_URL:-}" == *NEW_PASSWORD* || -z "${DATABASE_URL:-}" ]] && missing+=("DATABASE_URL (password)")
[[ -z "${PAYLOAD_SECRET:-}" ]] && missing+=("PAYLOAD_SECRET")
[[ -z "${S3_ACCESS_KEY_ID:-}" ]] && missing+=("S3_ACCESS_KEY_ID")
[[ -z "${S3_SECRET_ACCESS_KEY:-}" ]] && missing+=("S3_SECRET_ACCESS_KEY")
if (( ${#missing[@]} )); then
  echo "Fill in these values in $ENV_FILE first: ${missing[*]}" >&2
  exit 1
fi

case "${1:-load}" in
  verify)
    pnpm payload run scripts/verify-production.ts
    ;;
  load)
    echo "→ Creating tables in Supabase…"
    pnpm migrate
    echo "→ Uploading photos, reels and page content…"
    pnpm seed
    echo "→ Checking everything…"
    pnpm payload run scripts/verify-production.ts
    ;;
esac
