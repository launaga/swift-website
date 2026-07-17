-- ARSO schema — 0010 OPTIONAL: postgis zone centroid (§7.4).
-- Display + "nearest zone" hint ONLY, never pricing (09 §9.4.2). Isolated here
-- because the core schema must not depend on postgis: the pricing path is
-- zone-graph additive and never reads coordinates. Run this only where postgis
-- is available (e.g. Supabase). The local test harness skips it.

CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS centroid GEOGRAPHY(POINT, 4326);
