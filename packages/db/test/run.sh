#!/usr/bin/env bash
# Boot a throwaway Postgres 16 cluster, apply all core migrations, run the
# §7.11 acceptance assertions, then tear the cluster down. No Docker required.
#
#   packages/db/test/run.sh
#
# Postgres refuses to run as root, so the cluster runs as the `postgres` system
# user. The optional postgis migration (0010) is skipped — no postgis locally.
set -euo pipefail

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MIG_DIR="$PKG_DIR/migrations"
WORK="${TMPDIR:-/tmp}/arso-pgtest.$$"
PGDATA="$WORK/data"
PORT="${ARSO_PG_PORT:-55432}"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
export PGHOST="$WORK" PGPORT="$PORT" PGDATABASE=arso PGUSER=postgres

RUNAS() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }

cleanup() {
  RUNAS "$PGBIN/pg_ctl" -D "$PGDATA" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

# §7.11: no FLOAT/REAL/DOUBLE anywhere in the schema (money must be BIGINT).
echo "▶ lint: no floating-point types"
if grep -rniE '\b(float|real|double precision)\b' "$MIG_DIR"; then
  echo "✗ floating-point type found in schema (§7.1: money is BIGINT, never FLOAT)"
  exit 1
fi
echo "  ok — no float/real/double"

mkdir -p "$WORK"
[ "$(id -u)" = 0 ] && chown -R postgres:postgres "$WORK"

echo "▶ initdb ($PGBIN)"
RUNAS "$PGBIN/initdb" -D "$PGDATA" -U postgres --auth=trust >/dev/null

echo "▶ start cluster on $PGHOST:$PGPORT"
RUNAS "$PGBIN/pg_ctl" -D "$PGDATA" \
  -o "-p $PORT -k $WORK -c listen_addresses=''" \
  -l "$WORK/server.log" -w start >/dev/null

RUNAS "$PGBIN/createdb" -p "$PORT" -h "$WORK" -U postgres arso

echo "▶ apply migrations"
for f in "$MIG_DIR"/00*.sql; do
  case "$f" in
    *0010_optional_postgis*) echo "  skip $(basename "$f") (no postgis locally)"; continue ;;
  esac
  echo "  apply $(basename "$f")"
  RUNAS "$PGBIN/psql" -v ON_ERROR_STOP=1 -q -h "$WORK" -p "$PORT" -U postgres -d arso -f "$f"
done

echo "▶ run acceptance assertions"
LOG="$WORK/acceptance.out"
if RUNAS "$PGBIN/psql" -v ON_ERROR_STOP=1 -h "$WORK" -p "$PORT" -U postgres -d arso \
     -f "$PKG_DIR/test/acceptance.sql" >"$LOG" 2>&1; then
  grep -E 'PASS|ALL ACCEPTANCE' "$LOG" | sed 's/^psql[^ ]* NOTICE:  //'
  echo "✓ db acceptance suite passed"
else
  echo "✗ db acceptance suite FAILED:"
  cat "$LOG"
  exit 1
fi
