import { test } from "node:test";
import assert from "node:assert/strict";
import { estimate } from "../src/engine.ts";
import type { EstimateInput, StopType } from "../src/types.ts";
import { loadRuleSet } from "./helpers.ts";

const data = loadRuleSet();

const STOP_TYPES: StopType[] = [
  "DROP_ONLY", "PICKUP_ONLY", "SHORT_WAIT", "MEETING", "MEAL", "LONG_WAIT",
];

// Deterministic PRNG so property runs are reproducible.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function priceable(nStops: number, types: StopType[]): EstimateInput {
  return {
    corridorId: "JKT_BDG",
    vehicleClassId: "ECONOMY_MPV",
    tripType: "ONE_WAY",
    pickupZoneId: "ZONE_CIBUBUR",
    dropoffZoneId: "ZONE_DAGO",
    stops: types.slice(0, nStops).map((type) => ({ type })),
    tripDate: "2026-08-12",
  };
}

function totalOf(input: EstimateInput): number {
  const r = estimate(input, data);
  assert.equal(r.status, "OK", "expected priceable input");
  return r.status === "OK" ? r.total : NaN;
}

test("monotonicity: appending a stop never decreases the total", () => {
  const rand = mulberry32(42);
  for (let iter = 0; iter < 500; iter++) {
    const n = 1 + Math.floor(rand() * 6);
    const types = Array.from(
      { length: n + 1 },
      () => STOP_TYPES[Math.floor(rand() * STOP_TYPES.length)],
    );
    const before = totalOf(priceable(n, types));
    const after = totalOf(priceable(n + 1, types));
    assert.ok(after >= before, `adding a stop decreased price: ${before} -> ${after}`);
  }
});

test("monotonicity: a heavier stop type never decreases the total", () => {
  // Replace one DROP_ONLY (0.25h) with LONG_WAIT (3.0h): billable hours rise,
  // so total must be >= .
  const light = priceable(6, Array(6).fill("DROP_ONLY"));
  const heavy = priceable(6, ["LONG_WAIT", ...Array(5).fill("DROP_ONLY")] as StopType[]);
  assert.ok(totalOf(heavy) >= totalOf(light));
});

test("crossing the included-hours boundary charges overtime (strict increase)", () => {
  // 6 × LONG_WAIT (18h dwell) + 3.5 travel + 1 buffer = 22.5 → 23h billable,
  // 11h overtime × 50.000. Far above the flat 12h package.
  const flat = totalOf(priceable(1, ["DROP_ONLY"])); // 10.75h → within 12h
  const over = totalOf(priceable(6, Array(6).fill("LONG_WAIT")));
  assert.ok(over > flat, "overtime did not increase price");
});

test("round-up invariant: every priceable total is a multiple of 10.000", () => {
  const rand = mulberry32(7);
  for (let iter = 0; iter < 300; iter++) {
    const n = 1 + Math.floor(rand() * 8);
    const types = Array.from(
      { length: n },
      () => STOP_TYPES[Math.floor(rand() * STOP_TYPES.length)],
    );
    assert.equal(totalOf(priceable(n, types)) % 10000, 0);
  }
});
