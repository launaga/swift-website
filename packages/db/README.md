# ARSO database schema (Phase 1)

Postgres 16 schema for `docs/ARSO/07_Database_Spec.md`. **Phase 1 — gated.** Phase 0
(the live site + estimator) has no database. This is the reference implementation the
booking/payment/admin layer builds on once Gate 0→1 clears (`docs/ARSO/00` §0.3); it is
**not deployed to production**.

## What's here

```
migrations/   forward-only SQL (§7.1), 0001 → 0010, applied in order
test/         run.sh boots a throwaway cluster + runs acceptance.sql (§7.11)
```

Migration `0010` (postgis zone centroid) is **optional** — the pricing path never reads
coordinates (zone-graph model, 09 §9.4.2), so the core schema has no postgis dependency.
Run it only where postgis exists (e.g. Supabase).

## The parts that matter

- **Double-booking is prevented in the schema, not the app** (§7.6.1). `assignments` has
  GiST exclusion constraints so a vehicle (or driver) physically cannot hold two
  overlapping `blocked_period`s. "Check-then-insert" in app code is a race condition; this
  is not.
- **Quotes and invoices are immutable** via rewrite `RULE`s — even `psql` can't mutate a
  customer's price history. Corrections issue a superseding row.
- **Versioned pricing** (`corridor_prices`, `pricing_rules`) with a `no_overlapping_prices`
  exclusion constraint and a mandatory `reason` on every change — a March quote stays
  reproducible in June.
- **`quotes.margin_pct` is a stored generated column** — the §9.6 pricing audit becomes a
  one-line `SELECT`, forever, with no reporting project.
- **UU PDP by construction** (§7.9): per-purpose consent (never a single boolean), an
  erasure function that anonymises the person while keeping the financial record, a nightly
  ID-doc purge, and a `no_pii_in_params` CHECK on analytics.
- **Money is `BIGINT` rupiah**, time is `TIMESTAMPTZ`, PKs are UUID v7 (§7.1).

## Run the acceptance suite

```bash
packages/db/test/run.sh
```

Boots a temporary Postgres cluster (no Docker needed), applies every migration, and proves
the §7.11 criteria — including a concurrent overlapping-assignment insert that **must**
fail, and the immutability rules. Tears the cluster down after.

See `../pricing-engine/FINDINGS.md` and this schema's inline `NOTE (correction vs doc)`
comments for spec discrepancies fixed while building (partitioned-table PK, a non-IMMUTABLE
index predicate, partial-unique syntax).
