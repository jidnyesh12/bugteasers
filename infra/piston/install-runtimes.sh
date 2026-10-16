#!/bin/sh
set -eu

PISTON_URL="${PISTON_URL:-http://localhost:2000}"
RUNTIMES="${PISTON_RUNTIMES:-gcc=10.2.0 python=3.12.0 java=15.0.2}"

for runtime in $RUNTIMES; do
  language="${runtime%%=*}"
  version="${runtime#*=}"
  printf 'Installing %s %s... ' "$language" "$version"
  response=$(curl -sS -X POST "$PISTON_URL/api/v2/packages" \
    -H 'content-type: application/json' \
    -d "{\"language\":\"$language\",\"version\":\"$version\"}")
  case "$response" in
    *'"language"'*) echo "installed" ;;
    *'Already installed'*) echo "already installed" ;;
    *) echo "failed: $response" >&2; exit 1 ;;
  esac
done
