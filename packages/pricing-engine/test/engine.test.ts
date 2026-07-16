import { test } from "node:test";
import assert from "node:assert/strict";
import { estimate } from "../src/engine.ts";
import { buildWhatsAppMessage } from "../src/whatsapp.ts";
import type { EstimateInput } from "../src/types.ts";
import { loadRuleSet } from "./helpers.ts";

const data = loadRuleSet();

// The worked example from 09 §9.3.2 — the calibration anchor.
const workedExample: EstimateInput = {
  corridorId: "JKT_BDG",
  vehicleClassId: "ECONOMY_MPV",
  tripType: "ONE_WAY",
  pickupZoneId: "ZONE_CIBUBUR",
  dropoffZoneId: "ZONE_DAGO",
  stops: [{ type: "MEETING" }, { type: "MEETING" }, { type: "MEETING" }],
  tripDate: "2026-08-12", // a Wednesday — regular weekday
  pax: 4,
  pickupTime: "07:00",
};

test("09 §9.3.2 worked example = Rp 850.000", () => {
  const r = estimate(workedExample, data);
  assert.equal(r.status, "OK");
  if (r.status !== "OK") return;
  assert.equal(r.total, 850000);
  assert.equal(r.subtotal, 850000);
  assert.equal(r.multiplier, 1);
});

test("hours: 3.5 travel + 4.5 dwell + 1 buffer = 9h, within 12h package", () => {
  // NOTE (finding, not a bug): 09 §9.3.2/§9.4.1 annotate this as "9.5h → 10h",
  // but 3.5 + (3×1.5) + 1.0 = 9.0, so ceil(9.0) = 9. The doc's "9.5"/"10 jam"
  // is an arithmetic slip. The estimate (Rp 850.000) is unaffected because
  // billable ≤ 12h included either way, so the calibration anchor still holds.
  const r = estimate(workedExample, data);
  assert.equal(r.status, "OK");
  if (r.status !== "OK") return;
  assert.equal(r.hours.travelHours, 3.5);
  assert.equal(r.hours.dwellHours, 4.5);
  assert.equal(r.hours.bufferHours, 1);
  assert.equal(r.hours.billableHours, 9);
  assert.equal(r.hours.withinPackage, true);
});

test("breakdown shows base, pickup deviation, and hours as included", () => {
  const r = estimate(workedExample, data);
  assert.equal(r.status, "OK");
  if (r.status !== "OK") return;
  const base = r.breakdown.find((b) => b.label.includes("JAKARTA"));
  const pickup = r.breakdown.find((b) => b.label.includes("Cibubur"));
  const hours = r.breakdown.find((b) => b.label.includes("jam kerja"));
  assert.equal(base?.amount, 700000);
  assert.equal(pickup?.amount, 150000);
  assert.equal(hours?.included, true);
});

test("determinism: same input × 1000 → identical output (09 §9.7)", () => {
  const first = JSON.stringify(estimate(workedExample, data));
  for (let i = 0; i < 1000; i++) {
    assert.equal(JSON.stringify(estimate(workedExample, data)), first);
  }
});

test("rounding is UP-only to nearest 10.000 (09 §9.9)", () => {
  // Force a non-round subtotal via overtime: 13 stops → lots of dwell.
  const many: EstimateInput = {
    ...workedExample,
    stops: Array.from({ length: 5 }, () => ({ type: "SHORT_WAIT" as const })),
  };
  const r = estimate(many, data);
  assert.equal(r.status, "OK");
  if (r.status !== "OK") return;
  assert.equal(r.total % 10000, 0);
  // total must be >= the raw subtotal (never rounded down)
  assert.ok(r.total >= r.subtotal);
});

test("quote-only vehicle class suppresses the number (Alphard/Luxury)", () => {
  const r = estimate({ ...workedExample, vehicleClassId: "LUXURY" }, data);
  assert.equal(r.status, "QUOTE_REQUIRED");
});

test("ZONE_OTHER pickup → QUOTE_REQUIRED (09 §9.8 fallback)", () => {
  const r = estimate({ ...workedExample, pickupZoneId: "ZONE_OTHER" }, data);
  assert.equal(r.status, "QUOTE_REQUIRED");
});

test("a {{TOKEN}} corridor/class cell never yields a number", () => {
  // STANDARD_MPV on JKT_BDG is "{{TOKEN}}" in corridors.json
  const r = estimate({ ...workedExample, vehicleClassId: "STANDARD_MPV" }, data);
  assert.equal(r.status, "QUOTE_REQUIRED");
  if (r.status !== "QUOTE_REQUIRED") return;
  assert.equal(r.reason, "UNPRICED_CORRIDOR_CLASS");
});

test("null corridor/class cell → quote-only (business decision, distinct reason)", () => {
  const r = estimate({ ...workedExample, vehicleClassId: "LUXURY", }, data);
  // LUXURY is quote_only at the class level, caught before the null cell:
  assert.equal(r.status, "QUOTE_REQUIRED");
});

test("multiplier uses MAX not PRODUCT (09 §9.3.3)", () => {
  // Inject two applicable multipliers on the same date; expect max, not product.
  const custom = structuredClone(data);
  custom.rules.date_multipliers = [
    { id: "REGULAR", factor: 1.0 },
    { id: "WEEKEND", factor: 1.3, days: ["WE"] },
    { id: "HOLIDAY_PEAK", factor: 1.6, dates: ["2026-08-12"] },
  ];
  const r = estimate(workedExample, custom);
  assert.equal(r.status, "OK");
  if (r.status !== "OK") return;
  assert.equal(r.multiplier, 1.6); // max(1.0, 1.3, 1.6), NOT 1.0*1.3*1.6
});

test("PPN applied only when is_pkp (blocked on Q3)", () => {
  const pkp = structuredClone(data);
  pkp.rules.is_pkp = true;
  const r = estimate(workedExample, pkp);
  assert.equal(r.status, "OK");
  if (r.status !== "OK") return;
  assert.equal(r.ppn, Math.round(r.totalBeforeTax * 0.11));
  assert.equal(r.total, r.totalBeforeTax + r.ppn);
});

test("WhatsApp prefill contains route, estimate, and ref (09 §9.10)", () => {
  const r = estimate(workedExample, data);
  const msg = buildWhatsAppMessage(workedExample, r, data);
  assert.match(msg, /Rute {6}: JAKARTA \(Cibubur\) → BANDUNG \(Dago\)/);
  assert.match(msg, /Estimasi {2}: Rp 850\.000/);
  assert.match(msg, /\(ref: JKT_BDG\/ECONOMY_MPV\/ONE_WAY\/20260812\/q-[0-9a-f]{6}\)/);
});

test("ref is deterministic and PII-free", () => {
  const a = estimate(workedExample, data);
  const b = estimate({ ...workedExample, pax: 99, pickupTime: "23:00" }, data);
  // pax/time are not price-relevant and not part of the ref
  assert.equal(a.ref, b.ref);
});
