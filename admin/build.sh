#!/usr/bin/env bash
# Bundle the REAL pricing engine (packages/pricing-engine) into a browser ESM
# module the admin imports. Same code as the backend — ADR-006 "one engine,
# shared" is honoured literally, no re-implementation, no drift.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ESBUILD="${ESBUILD:-$(command -v esbuild || echo /tmp/node_modules/.bin/esbuild)}"

"$ESBUILD" "$ROOT/packages/pricing-engine/src/index.ts" \
  --bundle --format=esm --outfile="$ROOT/admin/lib/pricing-engine.js" \
  --log-level=warning
echo "✓ bundled admin/lib/pricing-engine.js"
