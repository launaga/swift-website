-- ARSO schema — 0006 bookings, stops, add-ons, assignments (§7.6).
-- This is where double-booking (business problem #4) is actually prevented — in
-- the schema, by exclusion constraints, not by "check then insert" race conditions.

CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  code            TEXT UNIQUE NOT NULL,        -- 'BK-2026-00412'
  quote_id        UUID NOT NULL REFERENCES quotes(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  company_id      UUID REFERENCES companies(id),
  status          booking_status NOT NULL DEFAULT 'DRAFT',

  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end   TIMESTAMPTZ NOT NULL,
  actual_start    TIMESTAMPTZ,
  actual_end      TIMESTAMPTZ,

  pickup_address  TEXT,                        -- PERSONAL DATA. Free text, NEVER used for pricing.
  pickup_zone_id  TEXT NOT NULL REFERENCES zones(id),   -- pricing uses THIS (§7.6)
  dropoff_address TEXT,
  dropoff_zone_id TEXT NOT NULL REFERENCES zones(id),

  total_idr       BIGINT NOT NULL,             -- copied from quote at confirm; frozen
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  cancel_fee_idr  BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,                 -- soft-delete (§7.1); referenced by idx_bookings_status_date
  CHECK (scheduled_end > scheduled_start)
);
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE booking_stops (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seq           SMALLINT NOT NULL,
  zone_id       TEXT NOT NULL REFERENCES zones(id),
  address       TEXT,                          -- PERSONAL DATA
  stop_type     TEXT NOT NULL,                 -- 'MEETING' | 'MEAL' | ...
  dwell_hours   NUMERIC(4,2) NOT NULL,         -- frozen from rule version at quote time
  actual_arrive TIMESTAMPTZ,
  actual_depart TIMESTAMPTZ,
  UNIQUE (booking_id, seq)
);

CREATE TABLE booking_addons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_key     TEXT NOT NULL,                 -- 'DRIVER_STAY' | 'MIDNIGHT_PICKUP' | ...
  qty           SMALLINT NOT NULL DEFAULT 1 CHECK (qty > 0),
  price_idr     BIGINT NOT NULL,               -- frozen from rule version
  UNIQUE (booking_id, addon_key)
);

CREATE TABLE assignments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  booking_id     UUID NOT NULL REFERENCES bookings(id),
  vehicle_id     UUID NOT NULL REFERENCES vehicles(id),
  driver_id      UUID NOT NULL REFERENCES drivers(id),

  -- Blocked window = trip ± deadhead/prep/return, NOT the trip window (§7.6.1).
  prep_buffer_min   SMALLINT NOT NULL DEFAULT 60,
  return_buffer_min SMALLINT NOT NULL DEFAULT 120,   -- [ASUMSI]; calibrate vs Q5 or it double-books long corridors
  blocked_period    TSTZRANGE NOT NULL,

  status         TEXT NOT NULL DEFAULT 'ACTIVE',     -- ACTIVE | RELEASED
  assigned_by    UUID NOT NULL REFERENCES users(id),
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at    TIMESTAMPTZ
);

-- A vehicle cannot be in two places at once. Enforced by Postgres, not by hope.
ALTER TABLE assignments ADD CONSTRAINT vehicle_no_double_booking
  EXCLUDE USING GIST (vehicle_id WITH =, blocked_period WITH &&)
  WHERE (status = 'ACTIVE');

-- Neither can a driver.
ALTER TABLE assignments ADD CONSTRAINT driver_no_double_booking
  EXCLUDE USING GIST (driver_id WITH =, blocked_period WITH &&)
  WHERE (status = 'ACTIVE');
