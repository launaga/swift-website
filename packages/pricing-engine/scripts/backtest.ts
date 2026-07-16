// Calibration backtest (09 §9.7) — the CI gate (06 §6.6).
// Runs the engine against historical manual quotes and checks that ≥80% land
// within ±10%. Quote-only inputs are excluded from the accuracy denominator.
// Run: node --experimental-strip-types scripts/backtest.ts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { estimate } from "../src/engine.ts";
import type { EstimateInput } from "../src/types.ts";
import { loadRuleSet } from "../test/helpers.ts";

const TOLERANCE = 0.1; // ±10%
const PASS_RATE = 0.8; // ≥80% within tolerance

interface Fixture {
  label: string;
  actual_idr: number;
  input: EstimateInput;
  note?: string;
}

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(
  readFileSync(join(here, "..", "backtest", "fixtures.json"), "utf8"),
).quotes as Fixture[];

const data = loadRuleSet();

let priced = 0;
let within = 0;
const outliers: string[] = [];

console.log("── ARSO pricing backtest (09 §9.7) ──");
for (const fx of fixtures) {
  const r = estimate(fx.input, data);
  if (r.status !== "OK") {
    console.log(`  quote-only  ${fx.label} (${r.reason}) — excluded`);
    continue;
  }
  priced++;
  const err = (r.total - fx.actual_idr) / fx.actual_idr;
  const ok = Math.abs(err) <= TOLERANCE;
  if (ok) within++;
  else outliers.push(`${fx.label}: est ${r.total} vs actual ${fx.actual_idr} (${(err * 100).toFixed(1)}%)`);
  const pct = (err * 100).toFixed(1).padStart(6);
  console.log(`  ${ok ? "✓" : "✗"} ${pct}%  ${fx.label}`);
}

const rate = priced ? within / priced : 0;
console.log(`\npriced: ${priced}  within ±10%: ${within}  rate: ${(rate * 100).toFixed(0)}%`);

if (priced < 30) {
  console.log(
    `\n⚠ Only ${priced} priced fixture(s). The §9.7 gate requires ≥30 real historical quotes\n` +
      "  (client data, Q7). Harness is ready — add rows to backtest/fixtures.json.",
  );
}
if (outliers.length) {
  console.log("\noutliers to classify (MISSING_RULE / MISPRICE_HISTORICAL / NEGOTIATED_EXCEPTION):");
  for (const o of outliers) console.log("  - " + o);
}

// Gate only enforced once a real dataset exists.
if (priced >= 30 && rate < PASS_RATE) {
  console.error(`\n✗ backtest FAILED: ${(rate * 100).toFixed(0)}% < ${PASS_RATE * 100}% within ±10%`);
  process.exit(1);
}
console.log("\n✓ backtest ok (gate enforced at ≥30 fixtures).");
