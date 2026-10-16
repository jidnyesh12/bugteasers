#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <postgres-connection-url>" >&2
  exit 1
fi

DATABASE_URL="$1"
MIGRATIONS_DIR="$(cd "$(dirname "$0")/../../apps/web/database/migrations" && pwd)"

command -v psql >/dev/null 2>&1 || {
  echo "psql is required (install the PostgreSQL client)" >&2
  exit 1
}

for migration in "$MIGRATIONS_DIR"/*.sql; do
  echo "Applying $(basename "$migration")"
  psql "$DATABASE_URL" --quiet --set ON_ERROR_STOP=1 --file "$migration"
done

echo "All migrations applied"
