-- ARSO schema acceptance tests (07 §7.11). Runs against a freshly-migrated DB.
-- Every assertion RAISEs on failure; with ON_ERROR_STOP the harness fails loudly.
\set ON_ERROR_STOP on

-- ─────────────────────────── fixtures ───────────────────────────
INSERT INTO users (id, code, email, full_name, role) VALUES
  ('00000000-0000-7000-8000-000000000001', 'U-1', 'admin@arasya.id', 'Admin', 'ADMIN');

INSERT INTO zones (id, city, label, is_reference_origin) VALUES
  ('ZONE_JKT_PUSAT',     'JAKARTA',         'Jakarta Pusat', true),
  ('ZONE_BANDUNG_KOTA',  'BANDUNG',         'Bandung Kota',  false),
  ('ZONE_CIBUBUR',       'JAKARTA_GREATER', 'Cibubur',       false),
  ('ZONE_DAGO',          'BANDUNG',         'Dago',          false);

INSERT INTO vehicle_classes (id, label, pax_incl_driver, sort_order) VALUES
  ('ECONOMY_MPV', 'Economy MPV', 7, 1);

INSERT INTO corridors (id, from_city, to_city, reference_origin_id, reference_destination_id, travel_hours) VALUES
  ('JKT_BDG', 'JAKARTA', 'BANDUNG', 'ZONE_JKT_PUSAT', 'ZONE_BANDUNG_KOTA', 3.5);

INSERT INTO rule_versions (id, hash, snapshot, published_at, published_by) VALUES
  ('00000000-0000-7000-8000-0000000000a1', 'sha256:test', '{}'::jsonb, now(), '00000000-0000-7000-8000-000000000001');

INSERT INTO customers (id, full_name, phone_e164, email) VALUES
  ('00000000-0000-7000-8000-0000000000c1', 'Budi', '+6281100000001', 'budi@x.id');

INSERT INTO quotes (
  id, code, ref_hash, rule_version_id, corridor_id, class_id, trip_type, tier,
  pickup_zone_id, dropoff_zone_id, trip_date, pickup_time, pax,
  billable_hours, breakdown, subtotal_idr, date_multiplier, total_idr,
  cost_floor_idr, expires_at
) VALUES (
  '00000000-0000-7000-8000-0000000000f1', 'QT-TEST-1', 'q-5d7308',
  '00000000-0000-7000-8000-0000000000a1', 'JKT_BDG', 'ECONOMY_MPV', 'ONE_WAY', 'DALAM_KOTA_12H',
  'ZONE_CIBUBUR', 'ZONE_DAGO', '2026-08-12', '07:00', 4,
  9.0, '[{"label":"base","amount":700000}]'::jsonb, 850000, 1.00, 850000,
  600000, now() + interval '2 days'
);

INSERT INTO bookings (
  id, code, quote_id, customer_id, status, scheduled_start, scheduled_end,
  pickup_zone_id, dropoff_zone_id, total_idr
) VALUES (
  '00000000-0000-7000-8000-0000000000b1', 'BK-TEST-1',
  '00000000-0000-7000-8000-0000000000f1', '00000000-0000-7000-8000-0000000000c1',
  'CONFIRMED', '2026-08-12 07:00+07', '2026-08-12 19:00+07',
  'ZONE_CIBUBUR', 'ZONE_DAGO', 850000
);

INSERT INTO invoices (id, code, booking_id, subtotal_idr, ppn_idr, total_idr, dp_required_idr) VALUES
  ('00000000-0000-7000-8000-0000000000f2', 'INV-TEST-1', '00000000-0000-7000-8000-0000000000b1', 850000, 0, 850000, 170000);

INSERT INTO vehicles (id, code, class_id, make, model, plate_number, ownership, home_base_zone_id, acquisition_cost_idr) VALUES
  ('00000000-0000-7000-8000-0000000000f3', 'VH-1', 'ECONOMY_MPV', 'Toyota', 'Avanza', 'B 1 ARA', 'OWNED', 'ZONE_JKT_PUSAT', 200000000);

INSERT INTO drivers (id, code, full_name, phone_e164, employment) VALUES
  ('00000000-0000-7000-8000-0000000000d1', 'DR-1', 'Slamet', '+6281100000009', 'PERMANENT');

INSERT INTO assignments (id, booking_id, vehicle_id, driver_id, blocked_period, assigned_by) VALUES
  ('00000000-0000-7000-8000-0000000000e1', '00000000-0000-7000-8000-0000000000b1',
   '00000000-0000-7000-8000-0000000000f3', '00000000-0000-7000-8000-0000000000d1',
   '[2026-08-12 06:00+07, 2026-08-12 21:00+07)', '00000000-0000-7000-8000-000000000001');

-- ─────────────────────────── assertions ───────────────────────────

-- T1: UUID v7 — version nibble must be '7'
DO $$ DECLARE u uuid := uuid_generate_v7();
BEGIN
  IF substring(u::text FROM 15 FOR 1) <> '7' THEN
    RAISE EXCEPTION 'FAIL T1: uuid_generate_v7 produced non-v7 %', u;
  END IF;
  RAISE NOTICE 'PASS T1: uuid_generate_v7 emits version-7 uuids';
END $$;

-- T2: quotes reject UPDATE (immutable by RULE)
UPDATE quotes SET total_idr = 999 WHERE code = 'QT-TEST-1';
DO $$ BEGIN
  IF (SELECT total_idr FROM quotes WHERE code = 'QT-TEST-1') <> 850000 THEN
    RAISE EXCEPTION 'FAIL T2: quote was mutated';
  END IF;
  RAISE NOTICE 'PASS T2: quotes reject UPDATE';
END $$;

-- T3: quotes reject DELETE
DELETE FROM quotes WHERE code = 'QT-TEST-1';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM quotes WHERE code = 'QT-TEST-1') THEN
    RAISE EXCEPTION 'FAIL T3: quote was deleted';
  END IF;
  RAISE NOTICE 'PASS T3: quotes reject DELETE';
END $$;

-- T4: invoices reject DELETE
DELETE FROM invoices WHERE code = 'INV-TEST-1';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM invoices WHERE code = 'INV-TEST-1') THEN
    RAISE EXCEPTION 'FAIL T4: invoice was deleted';
  END IF;
  RAISE NOTICE 'PASS T4: invoices reject DELETE';
END $$;

-- T5: vehicle double-booking blocked (overlapping ACTIVE assignment, same vehicle)
DO $$ BEGIN
  INSERT INTO assignments (booking_id, vehicle_id, driver_id, blocked_period, assigned_by) VALUES
    ('00000000-0000-7000-8000-0000000000b1', '00000000-0000-7000-8000-0000000000f3',
     '00000000-0000-7000-8000-0000000000d1', '[2026-08-12 20:00+07, 2026-08-12 23:00+07)',
     '00000000-0000-7000-8000-000000000001');
  RAISE EXCEPTION 'FAIL T5: overlapping vehicle assignment was allowed';
EXCEPTION WHEN exclusion_violation THEN
  RAISE NOTICE 'PASS T5: vehicle double-booking blocked by exclusion constraint';
END $$;

-- T6: corridor_prices no overlapping live price
INSERT INTO corridor_prices (corridor_id, class_id, trip_type, tier, price_idr, effective_from, created_by, reason)
  VALUES ('JKT_BDG', 'ECONOMY_MPV', 'ONE_WAY', 'DALAM_KOTA_12H', 700000, '2026-01-01', '00000000-0000-7000-8000-000000000001', 'initial');
DO $$ BEGIN
  INSERT INTO corridor_prices (corridor_id, class_id, trip_type, tier, price_idr, effective_from, created_by, reason)
    VALUES ('JKT_BDG', 'ECONOMY_MPV', 'ONE_WAY', 'DALAM_KOTA_12H', 750000, '2026-06-01', '00000000-0000-7000-8000-000000000001', 'overlap');
  RAISE EXCEPTION 'FAIL T6: overlapping corridor price was allowed';
EXCEPTION WHEN exclusion_violation THEN
  RAISE NOTICE 'PASS T6: overlapping corridor price blocked';
END $$;

-- T7: analytics no-PII CHECK rejects a phone key
DO $$ BEGIN
  INSERT INTO analytics_events (event, params) VALUES ('whatsapp_click', '{"phone":"+628123"}'::jsonb);
  RAISE EXCEPTION 'FAIL T7: PII param was accepted';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'PASS T7: analytics no-PII CHECK enforced';
END $$;

-- T8: PDP erasure anonymises the person, financial records survive (§7.9)
SELECT pdp_erase_customer('00000000-0000-7000-8000-0000000000c1');
DO $$ BEGIN
  IF (SELECT full_name FROM customers WHERE id = '00000000-0000-7000-8000-0000000000c1') <> 'REDACTED' THEN
    RAISE EXCEPTION 'FAIL T8a: customer not anonymised';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE code = 'BK-TEST-1')
     OR NOT EXISTS (SELECT 1 FROM invoices WHERE code = 'INV-TEST-1' AND total_idr = 850000) THEN
    RAISE EXCEPTION 'FAIL T8b: financial record lost on erasure';
  END IF;
  RAISE NOTICE 'PASS T8: PDP erasure — person redacted, invoice intact';
END $$;

-- T9: consent is per-purpose (two purposes coexist for one customer)
INSERT INTO consent_records (customer_id, purpose, granted, granted_at, method) VALUES
  ('00000000-0000-7000-8000-0000000000c1', 'booking_fulfilment', true, now(), 'wa_confirmation'),
  ('00000000-0000-7000-8000-0000000000c1', 'marketing_wa',       false, now(), 'web_checkbox');
DO $$ BEGIN
  IF (SELECT count(*) FROM consent_records WHERE customer_id = '00000000-0000-7000-8000-0000000000c1') <> 2 THEN
    RAISE EXCEPTION 'FAIL T9: consent not per-purpose';
  END IF;
  RAISE NOTICE 'PASS T9: consent recorded per-purpose';
END $$;

-- T10: generated margin_pct computed on the quote ((850000-600000)/850000*100 ≈ 29.41)
DO $$ DECLARE m numeric;
BEGIN
  SELECT margin_pct INTO m FROM quotes WHERE code = 'QT-TEST-1';
  IF m IS NULL OR round(m, 2) <> 29.41 THEN
    RAISE EXCEPTION 'FAIL T10: margin_pct wrong (got %)', m;
  END IF;
  RAISE NOTICE 'PASS T10: quotes.margin_pct generated column = %', round(m, 2);
END $$;

\echo 'ALL ACCEPTANCE ASSERTIONS PASSED'
