-- ARSO schema — 0005 customers, companies (§7.7) + immutable quotes (§7.5).

CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  legal_name  TEXT NOT NULL,
  npwp        TEXT,                            -- required for PKP invoicing — BLOCKED Q3
  billing_address TEXT,
  pic_name    TEXT,
  pic_phone   TEXT,
  payment_terms_days SMALLINT DEFAULT 0,       -- B2B credit (10 §6 risk)
  credit_limit_idr BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  full_name      TEXT NOT NULL,                -- PERSONAL DATA (general)
  phone_e164     TEXT NOT NULL,                -- PERSONAL DATA (general) — de-facto identity key
  email          TEXT,
  ktp_number_enc BYTEA,                        -- PERSONAL DATA — encrypted, RESTRICTED
  id_doc_key     TEXT,                         -- S3 key. NEVER a public URL (§7.9)
  id_doc_expires_at TIMESTAMPTZ,               -- auto-purge deadline
  company_id     UUID REFERENCES companies(id),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ,
  anonymised_at  TIMESTAMPTZ                    -- PDP erasure marker (§7.9)
);
-- Partial unique: one live customer per phone (erasure rewrites phone, see §7.9).
CREATE UNIQUE INDEX uq_customers_phone_live ON customers (phone_e164)
  WHERE deleted_at IS NULL AND anonymised_at IS NULL;

-- Quotes: an immutable priced snapshot. Never recomputed (glossary, §7.5).
CREATE TABLE quotes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  code              TEXT UNIQUE NOT NULL,     -- 'QT-2026-00187'
  ref_hash          TEXT NOT NULL,            -- matches the WA pre-fill ref (09 §9.10)
  rule_version_id   UUID NOT NULL REFERENCES rule_versions(id),

  corridor_id       TEXT NOT NULL REFERENCES corridors(id),
  class_id          TEXT NOT NULL REFERENCES vehicle_classes(id),
  trip_type         trip_type NOT NULL,
  tier              price_tier NOT NULL,
  pickup_zone_id    TEXT NOT NULL REFERENCES zones(id),
  dropoff_zone_id   TEXT NOT NULL REFERENCES zones(id),
  trip_date         DATE NOT NULL,
  pickup_time       TIME NOT NULL,
  pax               SMALLINT NOT NULL,

  billable_hours    NUMERIC(5,2) NOT NULL,
  breakdown         JSONB NOT NULL,           -- every line item, human-readable
  subtotal_idr      BIGINT NOT NULL,
  date_multiplier   NUMERIC(4,2) NOT NULL,
  ppn_idr           BIGINT NOT NULL DEFAULT 0,
  total_idr         BIGINT NOT NULL,

  cost_floor_idr    BIGINT,                   -- computed at issue; NULL if params missing
  margin_pct        NUMERIC(5,2) GENERATED ALWAYS AS (
                      CASE WHEN cost_floor_idr IS NULL OR total_idr = 0 THEN NULL
                           ELSE ((total_idr - cost_floor_idr)::NUMERIC / total_idr) * 100 END
                    ) STORED,

  supersedes_quote_id UUID REFERENCES quotes(id),  -- corrections issue a new row (§7.5)
  override_by       UUID REFERENCES users(id),
  override_reason   TEXT,
  override_delta_idr BIGINT,

  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES users(id),  -- NULL = self-serve web
  CONSTRAINT override_needs_reason CHECK (
    (override_by IS NULL AND override_reason IS NULL) OR
    (override_by IS NOT NULL AND override_reason IS NOT NULL)
  )
);

-- Immutability enforced at the database, not in application code (§7.5).
CREATE RULE quotes_no_update AS ON UPDATE TO quotes DO INSTEAD NOTHING;
CREATE RULE quotes_no_delete AS ON DELETE TO quotes DO INSTEAD NOTHING;
