-- ARSO schema — 0008 cross-cutting + UU PDP (§7.8, §7.9).
-- NOTE (correction vs doc): a partitioned table's partition key must be part of
-- its PK/unique constraint. The doc's "id BIGSERIAL PRIMARY KEY ... PARTITION BY
-- RANGE (at)" is invalid Postgres; the PK here is (id, at). Same semantics.

CREATE TABLE audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY,
  actor_id    UUID REFERENCES users(id),
  actor_role  TEXT,
  action      TEXT NOT NULL,                   -- 'quote.override', 'price.publish'
  entity      TEXT NOT NULL,
  entity_id   UUID,
  before      JSONB,
  after       JSONB,
  ip_hash     TEXT,                            -- hashed, not raw — IP is personal data
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, at)
) PARTITION BY RANGE (at);
CREATE TABLE audit_log_2026 PARTITION OF audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE audit_log_default PARTITION OF audit_log DEFAULT;

CREATE TABLE analytics_events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY,
  event       TEXT NOT NULL,                   -- 'whatsapp_click'
  params      JSONB NOT NULL,                  -- NO PII (enforced below)
  session_hash TEXT,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, at),
  -- Crude but loud: turns "we agreed not to log PII" into a runtime error (§7.8).
  CONSTRAINT no_pii_in_params CHECK (
    NOT (params ?| ARRAY['phone','email','name','ktp','address','full_name'])
  )
) PARTITION BY RANGE (at);
CREATE TABLE analytics_events_2026 PARTITION OF analytics_events
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE analytics_events_default PARTITION OF analytics_events DEFAULT;

-- Consent is per-PURPOSE, never a single boolean (§7.8) — the most common and
-- unfixable UU PDP schema error.
CREATE TABLE consent_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  customer_id  UUID NOT NULL REFERENCES customers(id),
  purpose      TEXT NOT NULL,                  -- 'booking_fulfilment' | 'marketing_wa' | 'id_verification'
  granted      BOOLEAN NOT NULL,
  granted_at   TIMESTAMPTZ NOT NULL,
  method       TEXT NOT NULL,                  -- 'web_checkbox' | 'wa_confirmation'
  evidence     JSONB,
  withdrawn_at TIMESTAMPTZ
);

CREATE TABLE data_subject_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  customer_id  UUID REFERENCES customers(id),
  request_type TEXT NOT NULL,                  -- 'ACCESS' | 'RECTIFY' | 'ERASE' | 'PORT'
  received_at  TIMESTAMPTZ NOT NULL,
  due_at       TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  handled_by   UUID REFERENCES users(id),
  notes        TEXT
);

-- ── PDP erasure (§7.9): anonymise the person, keep the financial record ──
-- "You cannot delete an invoice. You can delete the person from it."
CREATE OR REPLACE FUNCTION pdp_erase_customer(p_customer_id UUID) RETURNS void AS $$
BEGIN
  UPDATE customers SET
    full_name      = 'REDACTED',
    phone_e164     = 'REDACTED-' || left(id::text, 8),  -- keeps the unique index valid
    email          = NULL,
    ktp_number_enc = NULL,
    id_doc_key     = NULL,                               -- object purged from S3 separately
    notes          = NULL,
    anonymised_at  = now()
  WHERE id = p_customer_id;
  -- bookings, invoices, payments: rows survive, FKs survive, amounts survive.
END;
$$ LANGUAGE plpgsql;

-- ── Nightly purge (§7.9): expired ID docs. The difference between a policy and
-- a compliance posture. S3 lifecycle handles the objects; verify quarterly. ──
CREATE OR REPLACE FUNCTION pdp_purge_expired_id_docs() RETURNS integer AS $$
DECLARE n integer;
BEGIN
  UPDATE customers SET ktp_number_enc = NULL, id_doc_key = NULL
  WHERE id_doc_expires_at < now() AND id_doc_key IS NOT NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;
