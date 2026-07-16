-- ARSO schema — 0003 versioned pricing (§7.4).
-- The critical rule: pricing rows are never UPDATEd, they are superseded. A quote
-- issued in March must remain reproducible in June. Overlap is prevented by an
-- exclusion constraint, not by application logic.

CREATE TABLE corridor_prices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  corridor_id    TEXT NOT NULL REFERENCES corridors(id),
  class_id       TEXT NOT NULL REFERENCES vehicle_classes(id),
  trip_type      trip_type NOT NULL,
  tier           price_tier NOT NULL,
  price_idr      BIGINT,                           -- NULL = quote_only (deliberate)
  loss_leader    BOOLEAN NOT NULL DEFAULT FALSE,   -- explicit override of the floor check
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to   TIMESTAMPTZ,                      -- NULL = current
  created_by     UUID NOT NULL REFERENCES users(id),
  reason         TEXT NOT NULL,                    -- MANDATORY: "why did this price change?" (§7.4)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (price_idr IS NULL OR price_idr > 0),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Only one live price per (corridor, class, trip_type, tier) at any instant.
ALTER TABLE corridor_prices ADD CONSTRAINT no_overlapping_prices
  EXCLUDE USING GIST (
    corridor_id  WITH =,
    class_id     WITH =,
    trip_type    WITH =,
    tier         WITH =,
    tstzrange(effective_from, effective_to, '[)') WITH &&
  );

CREATE TABLE pricing_rules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  rule_key       TEXT NOT NULL,           -- 'overtime_per_hour.ECONOMY_MPV', 'multiplier.HOLIDAY_PEAK'
  rule_value     JSONB NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to   TIMESTAMPTZ,
  created_by     UUID NOT NULL REFERENCES users(id),
  reason         TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE pricing_rules ADD CONSTRAINT no_overlapping_rules
  EXCLUDE USING GIST (rule_key WITH =, tstzrange(effective_from, effective_to, '[)') WITH &&);

-- Content-addressed snapshot of the entire live ruleset. Quotes reference this,
-- freezing the rules that produced them (09 §9.9 Estimate≠Quote).
CREATE TABLE rule_versions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  hash         TEXT UNIQUE NOT NULL,      -- sha256 of the canonicalised ruleset
  snapshot     JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  published_by UUID NOT NULL REFERENCES users(id)
);
