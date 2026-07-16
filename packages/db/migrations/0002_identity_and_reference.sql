-- ARSO schema — 0002 identity (users, partners) + pricing reference data
-- (zones, corridors, vehicle_classes). These carry no personal data and are the
-- FK targets for almost everything else, so they come first.

-- Internal console users. RBAC roles per 06 §6.5. (Auth/2FA live in the app tier;
-- this table is the authorization subject.)
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  code        TEXT UNIQUE NOT NULL,            -- 'U-003'
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'READONLY',
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Partner vehicle owners (BLOCKED Q2). If any vehicle is PARTNER-owned, the
-- financial model changes entirely (10 §6) and revenue-share lives here.
CREATE TABLE partners (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  legal_name         TEXT NOT NULL,
  pic_name           TEXT,
  pic_phone          TEXT,
  revenue_share_pct  NUMERIC(5,2) CHECK (revenue_share_pct BETWEEN 0 AND 100),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Zones: the atomic unit of location for pricing (§7.4). `centroid` (postgis)
-- is added in the optional migration 0010 — it is display/nearest-zone only and
-- never touches pricing, so the core schema does not depend on postgis.
CREATE TABLE zones (
  id                    TEXT PRIMARY KEY,          -- 'ZONE_CIBUBUR'
  city                  TEXT NOT NULL,
  label                 TEXT NOT NULL,
  is_reference_origin   BOOLEAN NOT NULL DEFAULT FALSE,
  quote_only            BOOLEAN NOT NULL DEFAULT FALSE,
  deadhead_km_from_hq   NUMERIC(6,1),              -- {{TOKEN}} — blocked Q5
  active                BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE corridors (
  id                       TEXT PRIMARY KEY,       -- 'JKT_BDG'
  from_city                TEXT NOT NULL,
  to_city                  TEXT NOT NULL,
  reference_origin_id      TEXT NOT NULL REFERENCES zones(id),
  reference_destination_id TEXT NOT NULL REFERENCES zones(id),
  km                       NUMERIC(6,1),           -- {{TOKEN}}
  toll_idr                 BIGINT,                 -- {{TOKEN}}
  travel_hours             NUMERIC(4,2) NOT NULL,
  buffer_hours             NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  included_hours           SMALLINT NOT NULL DEFAULT 12,
  active                   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (from_city, to_city)                      -- directed: JKT→BDG ≠ BDG→JKT
);

CREATE TABLE vehicle_classes (
  id                   TEXT PRIMARY KEY,           -- 'ECONOMY_MPV'
  label                TEXT NOT NULL,
  pax_incl_driver      SMALLINT NOT NULL CHECK (pax_incl_driver BETWEEN 2 AND 30),
  luggage_capacity     SMALLINT,
  sort_order           SMALLINT NOT NULL,
  quote_only           BOOLEAN NOT NULL DEFAULT FALSE
);
