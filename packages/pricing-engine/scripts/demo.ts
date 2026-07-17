// Human-readable demo of the engine end-to-end (worked example + a quote-only path).
// Run: node --experimental-strip-types scripts/demo.ts

import { estimate } from "../src/engine.ts";
import { buildWhatsAppMessage } from "../src/whatsapp.ts";
import type { EstimateInput } from "../src/types.ts";
import { loadRuleSet } from "../test/helpers.ts";

const data = loadRuleSet();

const example: EstimateInput = {
  corridorId: "JKT_BDG",
  vehicleClassId: "ECONOMY_MPV",
  tripType: "ONE_WAY",
  pickupZoneId: "ZONE_CIBUBUR",
  dropoffZoneId: "ZONE_DAGO",
  stops: [{ type: "MEETING" }, { type: "MEETING" }, { type: "MEETING" }],
  tripDate: "2026-08-12",
  pax: 4,
  pickupTime: "07:00",
};

const r = estimate(example, data);
console.log("=== ESTIMATE ===");
console.log(JSON.stringify(r, null, 2));
console.log("\n=== WHATSAPP PREFILL ===");
console.log(buildWhatsAppMessage(example, r, data));

console.log("\n=== QUOTE-ONLY PATH (Alphard) ===");
const lux = estimate({ ...example, vehicleClassId: "LUXURY" }, data);
console.log(JSON.stringify(lux, null, 2));
