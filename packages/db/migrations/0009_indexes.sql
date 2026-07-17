-- ARSO schema — 0009 indexes (§7.10).
-- Sizing reality: ~3.400 bookings/year → ~34.000 rows after a decade. This fits
-- in RAM on the smallest instance money can buy. These indexes are for query
-- shape, not scale (§6.1 / §7.10).

CREATE INDEX idx_bookings_schedule    ON bookings USING GIST (tstzrange(scheduled_start, scheduled_end));
CREATE INDEX idx_bookings_status_date ON bookings (status, scheduled_start) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_customer    ON bookings (customer_id, scheduled_start DESC);
CREATE INDEX idx_quotes_corridor      ON quotes (corridor_id, created_at DESC);
CREATE INDEX idx_quotes_margin        ON quotes (margin_pct) WHERE margin_pct IS NOT NULL;
CREATE INDEX idx_assignments_vehicle  ON assignments USING GIST (vehicle_id, blocked_period) WHERE status = 'ACTIVE';
CREATE INDEX idx_payments_pending     ON payments (created_at) WHERE status = 'PENDING';
CREATE INDEX idx_corridor_prices_live ON corridor_prices (corridor_id, class_id, trip_type, tier) WHERE effective_to IS NULL;
