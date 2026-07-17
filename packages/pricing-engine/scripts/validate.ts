// Rule-data validator (09 §9.8 "validation script").
// Structural integrity + a coverage report of priceable / quote-only / unpriced
// cells. A "{{TOKEN}}" is flagged (a bug in production) but is NOT a hard error
// here — the engine forces those paths to QUOTE_REQUIRED. Malformed data IS a
// hard error. Run: node --experimental-strip-types scripts/validate.ts

import { loadRuleSet } from "../test/helpers.ts";
import { isKnownNumber, isToken } from "../src/util.ts";
import type { TripType } from "../src/types.ts";

const data = loadRuleSet();
const errors: string[] = [];
const tokens: string[] = [];
let priceable = 0;
let quoteOnly = 0;

// --- referential integrity: corridor references point at real zones ---
const zoneIds = new Set(data.zones.map((z) => z.id));
const classIds = new Set(data.vehicle_classes.map((c) => c.id));
for (const c of data.corridors) {
  if (!zoneIds.has(c.reference_origin)) {
    errors.push(`corridor ${c.id}: reference_origin ${c.reference_origin} is not a known zone`);
  }
  if (!zoneIds.has(c.reference_destination)) {
    errors.push(`corridor ${c.id}: reference_destination ${c.reference_destination} is not a known zone`);
  }
  for (const classId of Object.keys(c.price)) {
    if (!classIds.has(classId)) {
      errors.push(`corridor ${c.id}: price cell for unknown class ${classId}`);
    }
    for (const tt of ["ONE_WAY", "ROUND_TRIP"] as TripType[]) {
      const cell = c.price[classId]?.[tt];
      const path = `${c.id}/${classId}/${tt}`;
      if (cell === null) quoteOnly++;
      else if (isKnownNumber(cell)) priceable++;
      else if (isToken(cell)) tokens.push(path);
      else errors.push(`${path}: malformed price cell (${JSON.stringify(cell)})`);
    }
  }
}

// --- ZONE_OTHER fallback is mandatory (09 §9.8) ---
if (!data.zones.some((z) => z.id === "ZONE_OTHER" && z.quote_only)) {
  errors.push("ZONE_OTHER quote-only fallback is missing (09 §9.8 — mandatory)");
}

// --- multiplier policy must be MAX (09 §9.3.3) ---
if (data.rules.multiplier_policy !== "MAX_NOT_PRODUCT") {
  errors.push(`multiplier_policy must be MAX_NOT_PRODUCT, got ${data.rules.multiplier_policy}`);
}
// --- rounding must be UP (09 §9.9) ---
if (data.rules.rounding.mode !== "UP") {
  errors.push(`rounding.mode must be UP, got ${data.rules.rounding.mode}`);
}

// --- zone fee tokens ---
for (const z of data.zones) {
  for (const key of ["pickup_fee", "dropoff_fee"] as const) {
    const v = z[key];
    if (v !== undefined && isToken(v)) tokens.push(`zone ${z.id}.${key}`);
  }
}

console.log("── ARSO pricing rule validation ──");
console.log(`corridors: ${data.corridors.length}  zones: ${data.zones.length}  classes: ${data.vehicle_classes.length}`);
console.log(`priceable corridor cells : ${priceable}`);
console.log(`quote-only (null) cells  : ${quoteOnly}`);
console.log(`unresolved {{TOKEN}}s     : ${tokens.length}`);
if (tokens.length) {
  console.log("  " + tokens.slice(0, 40).join("\n  "));
  if (tokens.length > 40) console.log(`  … and ${tokens.length - 40} more`);
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} structural error(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("\n✓ structure valid. (Tokens are non-blocking: engine routes them to QUOTE_REQUIRED.)");
