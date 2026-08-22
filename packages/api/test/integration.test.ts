// End-to-end proof that the layers compose: pricing engine → quote → booking →
// invoice → assignment, against the REAL migrated schema. Run via test/run.sh
// (which boots a throwaway Postgres and sets PGHOST/PGPORT).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {
  createEstimate, issueQuote, createBooking, issueInvoice, createAssignment, ApiError,
} from "../src/services.ts";
import { loadRuleSet } from "../../pricing-engine/test/helpers.ts";
import type { EstimateInput } from "../../pricing-engine/src/types.ts";

const pool = new pg.Pool({
  host: process.env.PGHOST, port: Number(process.env.PGPORT || 5432),
  user: "postgres", database: "arso",
});
const q = (sql: string, params?: unknown[]) => pool.query(sql, params);
const ruleset = loadRuleSet();

const U = "00000000-0000-7000-8000-000000000001";
const RV = "00000000-0000-7000-8000-0000000000a1";
let customerId: string, vehicleId: string, driverId: string;

const workedExample: EstimateInput = {
  corridorId: "JKT_BDG", vehicleClassId: "ECONOMY_MPV", tripType: "ONE_WAY",
  pickupZoneId: "ZONE_CIBUBUR", dropoffZoneId: "ZONE_DAGO",
  stops: [{ type: "MEETING" }, { type: "MEETING" }, { type: "MEETING" }],
  tripDate: "2026-08-12", pickupTime: "07:00", pax: 4,
};

before(async () => {
  await q(`INSERT INTO users (id, code, email, full_name, role) VALUES ($1,'U-1','a@swift-rental.id','Admin','ADMIN')`, [U]);
  await q(`INSERT INTO zones (id, city, label) VALUES
    ('ZONE_JKT_PUSAT','JAKARTA','Jakarta Pusat'),('ZONE_BANDUNG_KOTA','BANDUNG','Bandung Kota'),
    ('ZONE_CIBUBUR','JAKARTA_GREATER','Cibubur'),('ZONE_DAGO','BANDUNG','Dago')`);
  await q(`INSERT INTO vehicle_classes (id,label,pax_incl_driver,sort_order) VALUES ('ECONOMY_MPV','Economy MPV',7,1)`);
  await q(`INSERT INTO corridors (id,from_city,to_city,reference_origin_id,reference_destination_id,travel_hours)
    VALUES ('JKT_BDG','JAKARTA','BANDUNG','ZONE_JKT_PUSAT','ZONE_BANDUNG_KOTA',3.5)`);
  await q(`INSERT INTO rule_versions (id,hash,snapshot,published_at,published_by) VALUES ($1,'sha256:test','{}',now(),$2)`, [RV, U]);
  customerId = (await q(`INSERT INTO customers (full_name,phone_e164) VALUES ('Budi','+628110000001') RETURNING id`)).rows[0].id;
  vehicleId = (await q(`INSERT INTO vehicles (code,class_id,make,model,plate_number,ownership,home_base_zone_id)
    VALUES ('VH-1','ECONOMY_MPV','Toyota','Avanza','B 1 ARA','OWNED','ZONE_JKT_PUSAT') RETURNING id`)).rows[0].id;
  driverId = (await q(`INSERT INTO drivers (code,full_name,phone_e164,employment) VALUES ('DR-1','Slamet','+628110000009','PERMANENT') RETURNING id`)).rows[0].id;
});
after(async () => { await pool.end(); });

test("estimate reuses the engine (worked example = Rp 850.000)", () => {
  const r = createEstimate(workedExample, ruleset);
  assert.equal(r.status, "OK");
  if (r.status === "OK") assert.equal(r.total, 850000);
});

test("full vertical: quote → booking → invoice(20% DP) → assignment", async () => {
  // issue quote (freezes rule version, immutable row)
  const quote = await issueQuote(q, { input: workedExample, ruleset, ruleVersionId: RV, tier: "DALAM_KOTA_12H", costFloorIdr: 610000, createdBy: U });
  assert.match(quote.code, /^QT-\d{4}-00001$/);
  assert.equal(Number(quote.total_idr), 850000);

  // the quote row is immutable at the DB (rewrite RULE) — UPDATE is a no-op
  await q(`UPDATE quotes SET total_idr = 1 WHERE id = $1`, [quote.id]);
  const still = (await q(`SELECT total_idr FROM quotes WHERE id = $1`, [quote.id])).rows[0];
  assert.equal(Number(still.total_idr), 850000, "quote must be immutable");

  // booking from the quote
  const booking = await createBooking(q, {
    quoteId: quote.id, customerId, scheduledStart: "2026-08-12T07:00+07", scheduledEnd: "2026-08-12T19:00+07",
    pickupZoneId: "ZONE_CIBUBUR", dropoffZoneId: "ZONE_DAGO", totalIdr: 850000,
  });
  assert.match(booking.code, /^BK-\d{4}-00001$/);

  // invoice with 20% DP computed in the service (850000 → 170000)
  const inv = await issueInvoice(q, { bookingId: booking.id, subtotalIdr: 850000 });
  assert.equal(Number(inv.dp_required_idr), 170000);

  // assign a vehicle+driver
  const a = await createAssignment(q, {
    bookingId: booking.id, vehicleId, driverId,
    blockedPeriod: "[2026-08-12 06:00+07,2026-08-12 21:00+07)", assignedBy: U,
  });
  assert.ok(a.id);
  const st = (await q(`SELECT status FROM bookings WHERE id=$1`, [booking.id])).rows[0].status;
  assert.equal(st, "ASSIGNED");
});

test("double-booking: an overlapping assignment is rejected (409)", async () => {
  // reuse the same booking/vehicle window → the exclusion constraint must fire
  const b2 = await issueQuote(q, { input: workedExample, ruleset, ruleVersionId: RV, tier: "DALAM_KOTA_12H", createdBy: U })
    .then((qt) => createBooking(q, { quoteId: qt.id, customerId, scheduledStart: "2026-08-12T20:00+07", scheduledEnd: "2026-08-12T22:00+07", pickupZoneId: "ZONE_CIBUBUR", dropoffZoneId: "ZONE_DAGO", totalIdr: 850000 }));
  await assert.rejects(
    () => createAssignment(q, { bookingId: b2.id, vehicleId, driverId, blockedPeriod: "[2026-08-12 20:30+07,2026-08-12 23:00+07)", assignedBy: U }),
    (e: unknown) => e instanceof ApiError && e.code === "DOUBLE_BOOKING" && e.httpStatus === 409,
  );
});
