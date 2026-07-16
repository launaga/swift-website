# 07 — DATABASE SPECIFICATION

**Engine:** PostgreSQL 16+
**Phase:** 0 = none (static JSON). 1 = tables in §3–§6. 2 = §7–§8.
**Precedence:** `09_Pricing_Engine.md` overrides this document on pricing semantics.

> **Phase 0 has no database.** If you provision Postgres for the estimator, you have
> already lost the scope argument. This document describes the Phase 1+ target.

---

## 7.1 Non-negotiable conventions

| Rule | Value | Why |
|---|---|---|
| Money | `BIGINT`, rupiah, no decimals | IDR has no practical subunit. **Never `FLOAT`.** `0.1 + 0.2 ≠ 0.3` is not acceptable in an invoice. |
| Time | `TIMESTAMPTZ` always | Business is `Asia/Jakarta` (UTC+7, no DST) — but drivers cross into WITA. Store UTC, render local. |
| IDs | `UUID v7` primary keys | Time-sortable, no enumeration leak, safe to generate client-side |
| Human refs | Separate `code` column, e.g. `BK-2026-00412` | Never expose UUIDs to customers or on invoices |
| Enums | Postgres `ENUM` for closed sets, `TEXT` + FK for extensible | Status is closed; zone list is not |
| Deletes | Soft-delete via `deleted_at` **except** PDP erasure (§7.9) | |
| Audit | Every mutating table has `created_at`, `updated_at`, `created_by`, `updated_by` | |
| Naming | `snake_case`, plural tables, singular columns | |
| Migrations | Forward-only, versioned, reviewed. **No manual prod SQL, ever.** | |

---

## 7.2 ERD (logical)

```
                        ┌──────────────────┐
                        │  vehicle_classes │
                        └────────┬─────────┘
                                 │ 1:N
        ┌──────────────┐  ┌──────▼───────┐   ┌───────────────┐
        │ vehicle_docs │◄─┤   vehicles   ├──►│  maintenance  │
        └──────────────┘  └──────┬───────┘   └───────────────┘
                                 │
     ┌───────┐   ┌──────────┐    │ N:1        ┌──────────┐
     │ zones ├──►│corridors │    │            │ drivers  │
     └───┬───┘   └────┬─────┘    │            └────┬─────┘
         │            │          │                 │
         │       ┌────▼─────────────┐              │
         │       │ corridor_prices  │              │
         │       │  (versioned)     │              │
         │       └────┬─────────────┘              │
         │            │                            │
         │       ┌────▼──────────┐                 │
         └──────►│ pricing_rules │                 │
                 │  (versioned)  │                 │
                 └────┬──────────┘                 │
                      │                            │
                 ┌────▼────┐                       │
                 │ quotes  │  ← IMMUTABLE snapshot │
                 └────┬────┘                       │
                      │ 0..1                       │
   ┌──────────┐  ┌────▼──────┐   ┌────────────┐    │
   │customers ├─►│ bookings  ├──►│assignments ├────┘
   └────┬─────┘  └──┬─────┬──┘   └────────────┘
        │           │     │
        │      ┌────▼──┐ ┌▼────────────┐
        │      │ stops │ │booking_addons│
        │      └───────┘ └─────────────┘
        │           │
   ┌────▼─────┐ ┌───▼──────┐  ┌──────────┐
   │companies │ │ invoices ├─►│ payments │
   └──────────┘ └──────────┘  └──────────┘

   Cross-cutting: audit_log, analytics_events, consent_records, data_subject_requests
```

---

## 7.3 Fleet & driver

```sql
CREATE TYPE vehicle_status AS ENUM ('ACTIVE','MAINTENANCE','SOLD','RESERVED_OWNER');
CREATE TYPE ownership_type AS ENUM ('OWNED','FINANCED','PARTNER');  -- BLOCKED ON Q2

CREATE TABLE vehicle_classes (
  id                   TEXT PRIMARY KEY,          -- 'ECONOMY_MPV'
  label                TEXT NOT NULL,
  pax_incl_driver      SMALLINT NOT NULL CHECK (pax_incl_driver BETWEEN 2 AND 30),
  luggage_capacity     SMALLINT,
  sort_order           SMALLINT NOT NULL,
  quote_only           BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE vehicles (
  id                   UUID PRIMARY KEY,
  code                 TEXT UNIQUE NOT NULL,      -- 'VH-004'
  class_id             TEXT NOT NULL REFERENCES vehicle_classes(id),
  make                 TEXT NOT NULL,
  model                TEXT NOT NULL,
  year                 SMALLINT,
  plate_number         TEXT UNIQUE NOT NULL,      -- SEE §7.9: arguably personal data if owner is an individual
  colour               TEXT,
  status               vehicle_status NOT NULL DEFAULT 'ACTIVE',
  ownership            ownership_type NOT NULL,   -- BLOCKED Q2
  partner_owner_id     UUID REFERENCES partners(id),  -- non-null iff ownership='PARTNER'
  acquisition_cost_idr BIGINT,                    -- NULL if PARTNER
  acquisition_date     DATE,
  residual_value_idr   BIGINT,
  expected_lifetime_km INTEGER,
  odometer_km          INTEGER NOT NULL DEFAULT 0,
  home_base_zone_id    TEXT NOT NULL REFERENCES zones(id),  -- deadhead origin. NOT always HQ.
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ,
  CONSTRAINT partner_consistency CHECK (
    (ownership = 'PARTNER' AND partner_owner_id IS NOT NULL AND acquisition_cost_idr IS NULL) OR
    (ownership <> 'PARTNER' AND partner_owner_id IS NULL)
  )
);
```

> **`home_base_zone_id` is not decoration.** If any vehicle is parked somewhere other than
> Bogor HQ, the deadhead cost in `09_Pricing_Engine.md` §9.5 is wrong for that vehicle.
> Deadhead is measured from where the car actually sleeps.

> **`ownership` is blocked on Q2 and it is load-bearing.** If vehicles are `PARTNER`-owned,
> `acquisition_cost` is not yours, depreciation is not your cost, revenue share is a new
> table, and `10_Financial_Model.md` is a different model entirely. Do not guess this.

```sql
CREATE TYPE doc_type AS ENUM ('STNK','KIR','INSURANCE','TAX_ANNUAL','PERMIT_ANGKUTAN');

CREATE TABLE vehicle_docs (
  id            UUID PRIMARY KEY,
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id),
  doc_type      doc_type NOT NULL,
  doc_number    TEXT,
  issued_at     DATE,
  expires_at    DATE NOT NULL,
  file_key      TEXT,                            -- S3 key, private bucket, never public URL
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicle_docs_expiry ON vehicle_docs (expires_at)
  WHERE expires_at > CURRENT_DATE;               -- powers the reminder job cheaply
```

```sql
CREATE TYPE driver_status AS ENUM ('ACTIVE','ON_LEAVE','SUSPENDED','TERMINATED');
CREATE TYPE employment_type AS ENUM ('PERMANENT','FREELANCE');

CREATE TABLE drivers (
  id                 UUID PRIMARY KEY,
  code               TEXT UNIQUE NOT NULL,
  full_name          TEXT NOT NULL,              -- PERSONAL DATA (general)
  phone_e164         TEXT NOT NULL,              -- PERSONAL DATA (general)
  sim_number_enc     BYTEA,                      -- PERSONAL DATA — encrypted at rest
  sim_class          TEXT,
  sim_expires_at     DATE,
  employment         employment_type NOT NULL,
  status             driver_status NOT NULL DEFAULT 'ACTIVE',
  base_salary_idr    BIGINT,                     -- RESTRICTED: financial data. RBAC: FINANCE only.
  home_zone_id       TEXT REFERENCES zones(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);
```

> **Employee salary is *data keuangan pribadi* → specific personal data under UU PDP Art. 4(2).**
> It does not belong in the same RBAC tier as a driver's name. Column-level access control,
> not just table-level.

---

## 7.4 Pricing tables — versioning is the whole point

**The critical rule: pricing rows are never `UPDATE`d. They are superseded.**

A quote issued in March must remain reproducible in June even after prices changed in April.
Without this, every pricing dispute is unwinnable and every historical margin report is a lie.

```sql
CREATE TABLE zones (
  id                    TEXT PRIMARY KEY,          -- 'ZONE_CIBUBUR'
  city                  TEXT NOT NULL,
  label                 TEXT NOT NULL,
  is_reference_origin   BOOLEAN NOT NULL DEFAULT FALSE,
  quote_only            BOOLEAN NOT NULL DEFAULT FALSE,
  deadhead_km_from_hq   NUMERIC(6,1),              -- {{TOKEN}} — blocked Q5
  centroid              GEOGRAPHY(POINT, 4326),    -- display + "nearest zone" hint ONLY, never pricing
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

CREATE TYPE trip_type AS ENUM ('ONE_WAY','ROUND_TRIP','MULTI_CITY');
CREATE TYPE price_tier AS ENUM ('DALAM_KOTA_12H','ALL_IN');

CREATE TABLE corridor_prices (
  id             UUID PRIMARY KEY,
  corridor_id    TEXT NOT NULL REFERENCES corridors(id),
  class_id       TEXT NOT NULL REFERENCES vehicle_classes(id),
  trip_type      trip_type NOT NULL,
  tier           price_tier NOT NULL,
  price_idr      BIGINT,                           -- NULL = quote_only (deliberate)
  loss_leader    BOOLEAN NOT NULL DEFAULT FALSE,   -- explicit override of the floor check
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to   TIMESTAMPTZ,                      -- NULL = current
  created_by     UUID NOT NULL REFERENCES users(id),
  reason         TEXT NOT NULL,                    -- MANDATORY. "why did this price change?"
  CHECK (price_idr IS NULL OR price_idr > 0),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Only one live price per (corridor, class, trip_type, tier) at any instant.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE corridor_prices ADD CONSTRAINT no_overlapping_prices
  EXCLUDE USING GIST (
    corridor_id  WITH =,
    class_id     WITH =,
    trip_type    WITH =,
    tier         WITH =,
    tstzrange(effective_from, effective_to, '[)') WITH &&
  );
```

> **`reason TEXT NOT NULL` is the cheapest governance control in this entire system.**
> In three years someone will ask "why is Cibubur 150k?" This column is the only thing
> that will answer. Cost: zero. Value: the §9.6 anomaly never happens again.

```sql
CREATE TABLE pricing_rules (
  id             UUID PRIMARY KEY,
  rule_key       TEXT NOT NULL,           -- 'overtime_per_hour.ECONOMY_MPV', 'multiplier.HOLIDAY_PEAK'
  rule_value     JSONB NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to   TIMESTAMPTZ,
  created_by     UUID NOT NULL REFERENCES users(id),
  reason         TEXT NOT NULL
);
ALTER TABLE pricing_rules ADD CONSTRAINT no_overlapping_rules
  EXCLUDE USING GIST (rule_key WITH =, tstzrange(effective_from, effective_to, '[)') WITH &&);

-- Content-addressed snapshot of the entire live ruleset. Quotes reference this.
CREATE TABLE rule_versions (
  id           UUID PRIMARY KEY,
  hash         TEXT UNIQUE NOT NULL,      -- sha256 of the canonicalised ruleset
  snapshot     JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  published_by UUID NOT NULL REFERENCES users(id)
);
```

---

## 7.5 Quotes — immutable by construction

```sql
CREATE TABLE quotes (
  id                UUID PRIMARY KEY,
  code              TEXT UNIQUE NOT NULL,     -- 'QT-2026-00187'
  ref_hash          TEXT NOT NULL,            -- matches the WA pre-fill ref (§9.10)
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

-- Enforce immutability at the database, not in application code.
CREATE RULE quotes_no_update AS ON UPDATE TO quotes DO INSTEAD NOTHING;
CREATE RULE quotes_no_delete AS ON DELETE TO quotes DO INSTEAD NOTHING;
```

> **`margin_pct` as a stored generated column turns the pricing audit into a `SELECT`.**
> `SELECT corridor_id, avg(margin_pct) FROM quotes GROUP BY 1 ORDER BY 2` answers
> "which corridor is bleeding money" in one query, forever, with no reporting project.
> This is the §9.6 audit, automated.

> **Application-level immutability is a comment, not a constraint.** The `RULE` means
> even a panicking developer with psql cannot rewrite a customer's price history.
> Corrections happen by issuing a superseding quote with `supersedes_quote_id`.

---

## 7.6 Bookings — where double-booking is actually prevented

```sql
CREATE TYPE booking_status AS ENUM (
  'DRAFT','PENDING_PAYMENT','CONFIRMED','ASSIGNED',
  'IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'
);

CREATE TABLE bookings (
  id              UUID PRIMARY KEY,
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
  pickup_zone_id  TEXT NOT NULL REFERENCES zones(id),   -- pricing uses THIS
  dropoff_address TEXT,
  dropoff_zone_id TEXT NOT NULL REFERENCES zones(id),

  total_idr       BIGINT NOT NULL,             -- copied from quote at confirm; frozen
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  cancel_fee_idr  BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (scheduled_end > scheduled_start)
);
```

> **`pickup_address` and `pickup_zone_id` are two different things and must stay that way.**
> Free-text address is for the driver. Zone is for the price. The moment someone prices
> off free text, `09_Pricing_Engine.md` §9.4.2 collapses and disputes begin.

```sql
CREATE TABLE booking_stops (
  id            UUID PRIMARY KEY,
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
```

### 7.6.1 The double-booking constraint

Business problem #4 is solved **here**, in the schema — not in application logic.
Application-level "check if available then insert" is a race condition wearing a suit.

```sql
CREATE TABLE assignments (
  id             UUID PRIMARY KEY,
  booking_id     UUID NOT NULL REFERENCES bookings(id),
  vehicle_id     UUID NOT NULL REFERENCES vehicles(id),
  driver_id      UUID NOT NULL REFERENCES drivers(id),

  -- Blocked window = trip ± deadhead/prep/return. NOT the trip window.
  prep_buffer_min   SMALLINT NOT NULL DEFAULT 60,
  return_buffer_min SMALLINT NOT NULL DEFAULT 120,
  blocked_period    TSTZRANGE NOT NULL,

  status         TEXT NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | RELEASED
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
```

> **Why buffers, not the raw trip window:** a car finishing in Bandung at 18:00 cannot
> start a Jakarta trip at 19:00. `return_buffer_min` must be derived from the corridor's
> return deadhead, not a flat constant. The 120-min default is `[ASUMSI]` and will
> generate real double-bookings on long corridors until calibrated against Q5 data.
> **Track this as a known defect, not a finished feature.**

> Driver rest hours (fatigue) are a **safety and liability** constraint, not just a
> scheduling one. Add a `driver_rest_hours` rule before Phase 2 dispatch, or you are one
> incident away from a problem no software fixes.

---

## 7.7 Customers, invoices, payments

```sql
CREATE TABLE customers (
  id             UUID PRIMARY KEY,
  full_name      TEXT NOT NULL,                -- PERSONAL DATA (general)
  phone_e164     TEXT NOT NULL,                -- PERSONAL DATA (general) — de-facto identity key
  email          TEXT,
  ktp_number_enc BYTEA,                        -- PERSONAL DATA — encrypted, RESTRICTED
  id_doc_key     TEXT,                         -- S3 key. NEVER a public URL. See §7.9
  id_doc_expires_at TIMESTAMPTZ,               -- auto-purge deadline
  company_id     UUID REFERENCES companies(id),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ,
  anonymised_at  TIMESTAMPTZ,                  -- PDP erasure marker (§7.9)
  UNIQUE (phone_e164) WHERE deleted_at IS NULL
);

CREATE TABLE companies (
  id          UUID PRIMARY KEY,
  legal_name  TEXT NOT NULL,
  npwp        TEXT,                            -- required for PKP invoicing — BLOCKED Q3
  billing_address TEXT,
  pic_name    TEXT,
  pic_phone   TEXT,
  payment_terms_days SMALLINT DEFAULT 0,       -- B2B credit. See 10_Financial_Model §6 risk.
  credit_limit_idr BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE invoice_status AS ENUM ('DRAFT','ISSUED','PARTIALLY_PAID','PAID','VOID','OVERDUE');

CREATE TABLE invoices (
  id             UUID PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,          -- 'INV-2026-00318' — gapless, sequential
  booking_id     UUID NOT NULL REFERENCES bookings(id),
  status         invoice_status NOT NULL DEFAULT 'DRAFT',
  subtotal_idr   BIGINT NOT NULL,
  ppn_idr        BIGINT NOT NULL DEFAULT 0,
  total_idr      BIGINT NOT NULL,
  dp_required_idr BIGINT NOT NULL,             -- 20% per current SOP
  issued_at      TIMESTAMPTZ,
  due_at         TIMESTAMPTZ,
  pdf_key        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (total_idr = subtotal_idr + ppn_idr)
);
CREATE RULE invoices_no_delete AS ON DELETE TO invoices DO INSTEAD NOTHING;

CREATE TYPE payment_method AS ENUM ('BANK_TRANSFER','CASH','QRIS','MIDTRANS','XENDIT');
CREATE TYPE payment_status AS ENUM ('PENDING','VERIFIED','REJECTED','REFUNDED');

CREATE TABLE payments (
  id              UUID PRIMARY KEY,
  invoice_id      UUID NOT NULL REFERENCES invoices(id),
  amount_idr      BIGINT NOT NULL CHECK (amount_idr > 0),
  method          payment_method NOT NULL,
  status          payment_status NOT NULL DEFAULT 'PENDING',
  is_dp           BOOLEAN NOT NULL DEFAULT FALSE,
  proof_key       TEXT,                         -- ⚠ SPECIFIC PERSONAL DATA (§7.9). Encrypted bucket.
  external_ref    TEXT,                         -- PSP transaction id
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  reject_reason   TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT verified_needs_verifier CHECK (
    (status <> 'VERIFIED') OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)
  ),
  CONSTRAINT idem UNIQUE (invoice_id, external_ref)   -- PSP webhook idempotency
);
```

> **`CONSTRAINT idem` is what stops a retried Midtrans webhook from double-crediting an
> invoice.** PSPs retry. They will retry. Build for it on day one or debug it at 2am.

> **`proof_key` points at a bank-transfer screenshot containing the customer's account
> number** → *data keuangan pribadi* → **specific personal data** under UU PDP Art. 4(2).
> Separate bucket, separate KMS key, separate RBAC tier, short retention (§7.9).
> This is not the same protection class as a booking note, and the schema must not pretend it is.

---

## 7.8 Cross-cutting

```sql
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES users(id),
  actor_role  TEXT,
  action      TEXT NOT NULL,                   -- 'quote.override', 'price.publish'
  entity      TEXT NOT NULL,
  entity_id   UUID,
  before      JSONB,
  after       JSONB,
  ip_hash     TEXT,                            -- hashed, not raw — IP is personal data
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (at);

CREATE TABLE analytics_events (
  id          BIGSERIAL PRIMARY KEY,
  event       TEXT NOT NULL,                   -- 'whatsapp_click'
  params      JSONB NOT NULL,                  -- NO PII. Enforced by CHECK below.
  session_hash TEXT,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_pii_in_params CHECK (
    NOT (params ?| ARRAY['phone','email','name','ktp','address','full_name'])
  )
) PARTITION BY RANGE (at);
```

> The `no_pii_in_params` CHECK is crude — it only catches top-level keys. It is still worth
> having: it converts "we agreed not to log PII" from a code-review norm into a runtime error
> that fails loudly the first time someone tries. Pair it with a review checklist.

```sql
CREATE TABLE consent_records (
  id           UUID PRIMARY KEY,
  customer_id  UUID NOT NULL REFERENCES customers(id),
  purpose      TEXT NOT NULL,                  -- 'booking_fulfilment' | 'marketing_wa' | 'id_verification'
  granted      BOOLEAN NOT NULL,
  granted_at   TIMESTAMPTZ NOT NULL,
  method       TEXT NOT NULL,                  -- 'web_checkbox' | 'wa_confirmation'
  evidence     JSONB,
  withdrawn_at TIMESTAMPTZ
);

CREATE TABLE data_subject_requests (
  id           UUID PRIMARY KEY,
  customer_id  UUID REFERENCES customers(id),
  request_type TEXT NOT NULL,                  -- 'ACCESS' | 'RECTIFY' | 'ERASE' | 'PORT'
  received_at  TIMESTAMPTZ NOT NULL,
  due_at       TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  handled_by   UUID REFERENCES users(id),
  notes        TEXT
);
```

> **Consent is per-*purpose*, not a single boolean.** "I agreed to you holding my KTP to
> fulfil a booking" is not "I agreed to WhatsApp marketing blasts." A single `consented`
> flag is the most common UU PDP schema error and it is unfixable after the fact —
> you cannot retroactively split a consent you never granularised.

---

## 7.9 Retention & UU PDP — the architecture constraint

This is where "delete my data" collides with "immutable financial records," and the
collision must be resolved **in the schema**, not discovered in an incident.

### Data classification

| Data | Class (UU PDP) | Retention | Storage |
|---|---|---|---|
| Name, phone, email | General | Active + 24 mo | Standard, encrypted at rest |
| KTP/SIM **number** | General (identity) | **Purge at trip completion + 30 d** | `BYTEA`, app-layer encrypted, RESTRICTED RBAC |
| KTP/SIM **image** | General (high sensitivity in practice) | **Purge at trip completion + 30 d** | Private bucket, KMS, lifecycle auto-delete |
| **Payment proof (contains account no.)** | **Specific — data keuangan pribadi** | **Purge at invoice PAID + 90 d** | **Separate bucket, separate KMS key, separate RBAC** |
| Driver salary | **Specific — financial** | Employment + statutory | Column-level RBAC: FINANCE only |
| Booking history | General | 5 y (tax/accounting) | Standard |
| Invoices, payments (amounts) | Business record | **10 y — statutory, NOT erasable** | Standard |
| Analytics events | Pseudonymous | 14 mo | Partitioned, auto-drop |
| Audit log | Business record | 5 y | Partitioned, append-only |

### The erasure conflict, resolved

**You cannot delete an invoice. You can delete the person from it.**

Erasure = **anonymisation, not row deletion**:

```sql
-- On an approved ERASE request:
UPDATE customers SET
  full_name      = 'REDACTED',
  phone_e164     = 'REDACTED-' || left(id::text, 8),   -- keeps the unique index valid
  email          = NULL,
  ktp_number_enc = NULL,
  id_doc_key     = NULL,                                -- object purged from S3 separately
  notes          = NULL,
  anonymised_at  = now()
WHERE id = $1;
-- bookings, invoices, payments: rows survive, FK survives, amounts survive.
-- The financial record is intact. The person is gone.
```

**Backups are the unsolved part and must be documented, not hidden.**
A PITR snapshot from three months ago still contains the erased name. Options:
1. Time-bound backup retention (e.g. 35 days) + a documented statement that erasure
   completes within that window. **This is the only realistic option at this scale.**
2. Crypto-shredding: per-customer KMS keys, destroy key on erasure. Correct, expensive,
   operationally heavy. Wrong tool for 14 vehicles.

Pick option 1. **Write it down in the privacy notice.** An undocumented gap between the
promise and the backup is the actual violation — not the gap itself.

### Automated purge job (Phase 1, non-negotiable)
```sql
-- Nightly. This job is the difference between a policy and a compliance posture.
UPDATE customers SET ktp_number_enc = NULL, id_doc_key = NULL
WHERE id_doc_expires_at < now() AND id_doc_key IS NOT NULL;
-- S3 lifecycle rule handles the objects. Verify quarterly — lifecycle rules fail silently.
```

> **The Phase 0 version of all this requires no code.** See `12_Operations_SOP.md` §4:
> stop keeping KTP photos in the admin's phone gallery, turn off WhatsApp auto-backup to
> Google Photos, delete after trip completion. That is a 1-hour process change that removes
> more real risk than the entire Phase 1 encryption layer.

---

## 7.10 Indexing

```sql
CREATE INDEX idx_bookings_schedule    ON bookings USING GIST (tstzrange(scheduled_start, scheduled_end));
CREATE INDEX idx_bookings_status_date ON bookings (status, scheduled_start) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_customer    ON bookings (customer_id, scheduled_start DESC);
CREATE INDEX idx_quotes_corridor      ON quotes (corridor_id, created_at DESC);
CREATE INDEX idx_quotes_margin        ON quotes (margin_pct) WHERE margin_pct IS NOT NULL;
CREATE INDEX idx_assignments_vehicle  ON assignments USING GIST (vehicle_id, blocked_period) WHERE status = 'ACTIVE';
CREATE INDEX idx_payments_pending     ON payments (created_at) WHERE status = 'PENDING';
CREATE INDEX idx_corridor_prices_live ON corridor_prices (corridor_id, class_id, trip_type, tier) WHERE effective_to IS NULL;
```

> **Sizing reality check.** At 14 vehicles × ~20 trips/month = ~280 bookings/month =
> ~3.400/year. After ten years: 34.000 rows. **This fits in RAM on the smallest instance
> money can buy.** Do not read this section as permission to build for scale. There is no
> sharding, no read replica, no Redis cluster, no Kubernetes in this system's future
> until the fleet is 10× larger. Postgres + one app server + S3 is the correct architecture
> for the next five years, and saying so out loud is worth more than any index above.

---

## 7.11 Acceptance criteria

- [ ] No `FLOAT`/`REAL`/`DOUBLE` anywhere in the schema. Grep-verified in CI.
- [ ] `quotes` and `invoices` reject UPDATE/DELETE — verified by integration test.
- [ ] Exclusion constraints on `assignments` proven by a concurrent-insert test (two transactions, one must fail).
- [ ] Exclusion constraints on `corridor_prices` / `pricing_rules` proven by an overlapping-insert test.
- [ ] `reason` is non-null on every pricing mutation — enforced by NOT NULL, not by convention.
- [ ] PDP erasure path tested end-to-end: anonymise → financial records intact → S3 objects purged.
- [ ] Purge job runs nightly; failure pages someone.
- [ ] Consent is per-purpose; no global boolean anywhere.
- [ ] All `{{TOKEN}}` columns nullable and never dereferenced in a pricing path without a `quote_only` fallback.
- [ ] Migrations forward-only; zero manual production SQL in the runbook.

---

*End 07.*
