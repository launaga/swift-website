-- ARSO schema — 0004 fleet & drivers (§7.3).

CREATE TABLE vehicles (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  code                 TEXT UNIQUE NOT NULL,      -- 'VH-004'
  class_id             TEXT NOT NULL REFERENCES vehicle_classes(id),
  make                 TEXT NOT NULL,
  model                TEXT NOT NULL,
  year                 SMALLINT,
  plate_number         TEXT UNIQUE NOT NULL,      -- arguably personal data if owner is an individual (§7.9)
  colour               TEXT,
  status               vehicle_status NOT NULL DEFAULT 'ACTIVE',
  ownership            ownership_type NOT NULL,   -- BLOCKED Q2
  partner_owner_id     UUID REFERENCES partners(id),  -- non-null iff ownership='PARTNER'
  acquisition_cost_idr BIGINT,                    -- NULL if PARTNER
  acquisition_date     DATE,
  residual_value_idr   BIGINT,
  expected_lifetime_km INTEGER,
  odometer_km          INTEGER NOT NULL DEFAULT 0,
  home_base_zone_id    TEXT NOT NULL REFERENCES zones(id),  -- deadhead origin; NOT always HQ (§7.3)
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ,
  CONSTRAINT partner_consistency CHECK (
    (ownership = 'PARTNER' AND partner_owner_id IS NOT NULL AND acquisition_cost_idr IS NULL) OR
    (ownership <> 'PARTNER' AND partner_owner_id IS NULL)
  )
);
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE vehicle_docs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id),
  doc_type      doc_type NOT NULL,
  doc_number    TEXT,
  issued_at     DATE,
  expires_at    DATE NOT NULL,
  file_key      TEXT,                             -- S3 key, private bucket, never a public URL
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- NOTE (correction vs doc §7.3): the doc's "WHERE expires_at > CURRENT_DATE" is
-- invalid — a partial-index predicate must be IMMUTABLE and CURRENT_DATE is not.
-- A plain b-tree on expires_at powers the reminder job (WHERE expires_at < now()
-- + interval) just as cheaply.
CREATE INDEX idx_vehicle_docs_expiry ON vehicle_docs (expires_at);

CREATE TABLE maintenance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id),
  kind          TEXT NOT NULL,                    -- 'SERVICE' | 'TYRE' | 'REPAIR'
  odometer_km   INTEGER,
  cost_idr      BIGINT CHECK (cost_idr IS NULL OR cost_idr >= 0),
  performed_at  DATE NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE drivers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  code               TEXT UNIQUE NOT NULL,
  full_name          TEXT NOT NULL,              -- PERSONAL DATA (general)
  phone_e164         TEXT NOT NULL,              -- PERSONAL DATA (general)
  sim_number_enc     BYTEA,                      -- PERSONAL DATA — app-layer encrypted at rest
  sim_class          TEXT,
  sim_expires_at     DATE,
  employment         employment_type NOT NULL,
  status             driver_status NOT NULL DEFAULT 'ACTIVE',
  base_salary_idr    BIGINT,                     -- RESTRICTED: specific personal data (§7.3). RBAC: FINANCE only.
  home_zone_id       TEXT REFERENCES zones(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);
