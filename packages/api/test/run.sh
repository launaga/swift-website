#!/usr/bin/env bash
# Boot a throwaway Postgres, apply the schema migrations, then run the API
# integration test (engine → quote → booking → invoice → assignment) against it.
set -euo pipefail

API_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MIG_DIR="$API_DIR/../db/migrations"
WORK="${TMPDIR:-/tmp}/arso-apitest.$$"
PGDATA="$WORK/data"
PORT="${ARSO_PG_PORT:-55440}"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
export PGHOST="$WORK" PGPORT="$PORT"

RUNAS() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
cleanup() { RUNAS "$PGBIN/pg_ctl" -D "$PGDATA" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

# node-postgres must be installed (offline-cached under node_modules if present).
if [ ! -d "$API_DIR/node_modules/pg" ]; then
  echo "▶ npm install (pg)"; ( cd "$API_DIR" && npm install --no-audit --no-fund --silent ); fi

mkdir -p "$WORK"; [ "$(id -u)" = 0 ] && chown -R postgres:postgres "$WORK"
echo "▶ initdb"; RUNAS "$PGBIN/initdb" -D "$PGDATA" -U postgres --auth=trust >/dev/null
echo "▶ start cluster"; RUNAS "$PGBIN/pg_ctl" -D "$PGDATA" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/server.log" -w start >/dev/null
RUNAS "$PGBIN/createdb" -p "$PORT" -h "$WORK" -U postgres arso
echo "▶ apply migrations"
for f in "$MIG_DIR"/0*.sql; do
  case "$f" in *0010_optional_postgis*) continue ;; esac
  RUNAS "$PGBIN/psql" -v ON_ERROR_STOP=1 -q -h "$WORK" -p "$PORT" -U postgres -d arso -f "$f" >/dev/null
done

# The Postgres socket is owned by the postgres user; let the (root) node client reach it.
chmod 777 "$WORK" 2>/dev/null || true
echo "▶ run integration test"
cd "$API_DIR"
node --experimental-strip-types --test test/integration.test.ts
