-- ARSO schema — 0007 invoices & payments (§7.7).

CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  code           TEXT UNIQUE NOT NULL,          -- 'INV-2026-00318' — gapless, sequential
  booking_id     UUID NOT NULL REFERENCES bookings(id),
  status         invoice_status NOT NULL DEFAULT 'DRAFT',
  subtotal_idr   BIGINT NOT NULL,
  ppn_idr        BIGINT NOT NULL DEFAULT 0,
  total_idr      BIGINT NOT NULL,
  dp_required_idr BIGINT NOT NULL,              -- 20% per current SOP
  issued_at      TIMESTAMPTZ,
  due_at         TIMESTAMPTZ,
  pdf_key        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (total_idr = subtotal_idr + ppn_idr)
);
-- Financial record: never deletable (§7.7). Erasure anonymises the person, not the row.
CREATE RULE invoices_no_delete AS ON DELETE TO invoices DO INSTEAD NOTHING;

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id),
  amount_idr      BIGINT NOT NULL CHECK (amount_idr > 0),
  method          payment_method NOT NULL,
  status          payment_status NOT NULL DEFAULT 'PENDING',
  is_dp           BOOLEAN NOT NULL DEFAULT FALSE,
  proof_key       TEXT,                         -- ⚠ SPECIFIC PERSONAL DATA (§7.9). Separate encrypted bucket.
  external_ref    TEXT,                         -- PSP transaction id
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  reject_reason   TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT verified_needs_verifier CHECK (
    (status <> 'VERIFIED') OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)
  ),
  -- Stops a retried Midtrans/Xendit webhook from double-crediting an invoice (§7.7).
  CONSTRAINT idem UNIQUE (invoice_id, external_ref)
);
