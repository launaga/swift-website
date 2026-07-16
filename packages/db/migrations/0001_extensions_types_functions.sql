-- ARSO schema — 0001 extensions, enum types, helper functions.
-- Target: PostgreSQL 16+ (07_Database_Spec.md). Forward-only migration (§7.1).

-- pgcrypto: gen_random_bytes for the UUID v7 generator + app-layer needs.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- btree_gist: lets scalar columns (=) sit in the same EXCLUDE constraint as a
-- range (&&). This is the mechanism behind the double-booking fix (§7.6.1) and
-- the no-overlapping-price constraint (§7.4). Postgres is non-negotiable for it
-- (ADR-003).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- UUID v7 primary keys (§7.1): time-sortable, no enumeration leak, client-safe.
-- Postgres 16 has no native v7 (that lands in 18), so we generate it explicitly:
-- 48-bit millisecond timestamp + 74 random bits, with the version nibble (0x7)
-- and the 10xx variant set per RFC 9562.
CREATE OR REPLACE FUNCTION uuid_generate_v7() RETURNS uuid AS $$
DECLARE
  ts_ms bigint := (extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  b bytea := substring(int8send(ts_ms) FROM 3 FOR 6) || gen_random_bytes(10);
BEGIN
  b := set_byte(b, 6, (get_byte(b, 6) & 15) | 112);  -- 0x7 in the version nibble
  b := set_byte(b, 8, (get_byte(b, 8) & 63) | 128);  -- 10xx variant
  RETURN encode(b, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- updated_at maintenance (§7.1: every mutating table has updated_at).
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Closed-set enums (§7.1: ENUM for closed sets, TEXT+FK for extensible) ──
CREATE TYPE user_role       AS ENUM ('OWNER','ADMIN','FINANCE','DISPATCH','DRIVER','READONLY');
CREATE TYPE vehicle_status  AS ENUM ('ACTIVE','MAINTENANCE','SOLD','RESERVED_OWNER');
CREATE TYPE ownership_type  AS ENUM ('OWNED','FINANCED','PARTNER');          -- BLOCKED Q2
CREATE TYPE doc_type        AS ENUM ('STNK','KIR','INSURANCE','TAX_ANNUAL','PERMIT_ANGKUTAN');
CREATE TYPE driver_status   AS ENUM ('ACTIVE','ON_LEAVE','SUSPENDED','TERMINATED');
CREATE TYPE employment_type AS ENUM ('PERMANENT','FREELANCE');
CREATE TYPE trip_type       AS ENUM ('ONE_WAY','ROUND_TRIP','MULTI_CITY');
CREATE TYPE price_tier      AS ENUM ('DALAM_KOTA_12H','ALL_IN');
CREATE TYPE booking_status  AS ENUM ('DRAFT','PENDING_PAYMENT','CONFIRMED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW');
CREATE TYPE invoice_status  AS ENUM ('DRAFT','ISSUED','PARTIALLY_PAID','PAID','VOID','OVERDUE');
CREATE TYPE payment_method  AS ENUM ('BANK_TRANSFER','CASH','QRIS','MIDTRANS','XENDIT');
CREATE TYPE payment_status  AS ENUM ('PENDING','VERIFIED','REJECTED','REFUNDED');
