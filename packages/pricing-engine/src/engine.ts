// ARSO Pricing Engine — the pure function (09_Pricing_Engine.md §9.3).
//
// Contract (09 §9.12):
//   - Pure: no I/O, no clock, no network. Rules and trip date are injected.
//   - Deterministic: same input -> same output, always.
//   - Never emits a number derived from a "{{TOKEN}}" or a `null` (quote-only)
//     cell. Any such path short-circuits to QUOTE_REQUIRED — so no unresolved
//     value is ever reachable as a displayed price.

import type {
  BreakdownLine,
  Corridor,
  EstimateInput,
  EstimateResult,
  RuleSet,
  VehicleClass,
  Zone,
} from "./types.ts";
import {
  ceilHours,
  fnv1a,
  formatIDR,
  isKnownNumber,
  roundUpTo,
  weekdayCode,
} from "./util.ts";

function byId<T extends { id: string }>(list: T[], id: string): T | undefined {
  return list.find((x) => x.id === id);
}

/** Short deterministic ref of the price-relevant inputs. No PII (09 §9.10). */
function computeRef(input: EstimateInput): { ref: string; refFull: string } {
  const canonical = JSON.stringify({
    c: input.corridorId,
    v: input.vehicleClassId,
    t: input.tripType,
    pu: input.pickupZoneId,
    do: input.dropoffZoneId,
    s: input.stops.map((s) => s.type),
    a: (input.addonIds ?? []).slice().sort(),
    d: input.tripDate ?? "",
  });
  const ref = "q-" + fnv1a(canonical);
  const datePart = (input.tripDate ?? "").replace(/-/g, "");
  const refFull = [
    input.corridorId,
    input.vehicleClassId,
    input.tripType,
    datePart,
    ref,
  ].join("/");
  return { ref, refFull };
}

function quoteRequired(
  input: EstimateInput,
  reason: string,
  disclaimer: string,
): EstimateResult {
  const { ref, refFull } = computeRef(input);
  return { status: "QUOTE_REQUIRED", reason, disclaimer, ref, refFull };
}

export function estimate(input: EstimateInput, data: RuleSet): EstimateResult {
  const { rules } = data;
  const disclaimer = rules.estimate_disclaimer_id;

  const corridor: Corridor | undefined = byId(data.corridors, input.corridorId);
  const vclass: VehicleClass | undefined = byId(
    data.vehicle_classes,
    input.vehicleClassId,
  );
  const pickup: Zone | undefined = byId(data.zones, input.pickupZoneId);
  const dropoff: Zone | undefined = byId(data.zones, input.dropoffZoneId);

  if (!corridor) return quoteRequired(input, "UNKNOWN_CORRIDOR", disclaimer);
  if (!vclass) return quoteRequired(input, "UNKNOWN_VEHICLE_CLASS", disclaimer);
  if (!pickup) return quoteRequired(input, "UNKNOWN_PICKUP_ZONE", disclaimer);
  if (!dropoff) return quoteRequired(input, "UNKNOWN_DROPOFF_ZONE", disclaimer);

  // quote-only inputs suppress the number entirely (09 §9.9)
  if (vclass.quote_only) return quoteRequired(input, "QUOTE_ONLY_CLASS", disclaimer);
  if (pickup.quote_only) return quoteRequired(input, "QUOTE_ONLY_PICKUP", disclaimer);
  if (dropoff.quote_only) return quoteRequired(input, "QUOTE_ONLY_DROPOFF", disclaimer);

  // ---------- STEP 2: base ----------
  const baseCell = corridor.price?.[input.vehicleClassId]?.[input.tripType];
  if (baseCell === null) {
    return quoteRequired(input, "QUOTE_ONLY_CORRIDOR_CLASS", disclaimer);
  }
  if (!isKnownNumber(baseCell)) {
    // "{{TOKEN}}" or missing -> unpriceable, do not guess
    return quoteRequired(input, "UNPRICED_CORRIDOR_CLASS", disclaimer);
  }
  const base = baseCell;

  // ---------- STEP 1: derive the billing meter ----------
  const roundTripFactor = input.tripType === "ROUND_TRIP" ? 2 : 1;
  const travelHours = corridor.travel_hours * roundTripFactor;
  let dwellHours = 0;
  for (const stop of input.stops) {
    const d = rules.stop_type_dwell_hours[stop.type];
    if (!isKnownNumber(d)) {
      return quoteRequired(input, "UNKNOWN_STOP_TYPE:" + stop.type, disclaimer);
    }
    dwellHours += d;
  }
  const bufferHours = corridor.buffer_hours;
  const billableHours = ceilHours(travelHours + dwellHours + bufferHours);

  // ---------- STEP 3: additive deviations ----------
  const pickupFeeCell = pickup.pickup_fee ?? 0;
  const dropoffFeeCell = dropoff.dropoff_fee ?? 0;
  if (!isKnownNumber(pickupFeeCell)) {
    return quoteRequired(input, "UNPRICED_PICKUP_FEE", disclaimer);
  }
  if (!isKnownNumber(dropoffFeeCell)) {
    return quoteRequired(input, "UNPRICED_DROPOFF_FEE", disclaimer);
  }
  const pickupFee = pickupFeeCell;
  const dropoffFee = dropoffFeeCell;

  const overtimeHours = Math.max(0, billableHours - corridor.included_hours);
  let overtimeFee = 0;
  if (overtimeHours > 0) {
    const rate = rules.overtime_per_hour[input.vehicleClassId];
    if (!isKnownNumber(rate)) {
      // overtime is owed but we don't have a rate -> can't show a number
      return quoteRequired(input, "UNPRICED_OVERTIME", disclaimer);
    }
    overtimeFee = overtimeHours * rate;
  }

  let addonsTotal = 0;
  const addonLines: BreakdownLine[] = [];
  for (const addonId of input.addonIds ?? []) {
    const addon = rules.addons[addonId];
    if (!addon || !isKnownNumber(addon.price)) {
      return quoteRequired(input, "UNPRICED_ADDON:" + addonId, disclaimer);
    }
    addonsTotal += addon.price;
    addonLines.push({ label: addonId, amount: addon.price });
  }

  const subtotal = base + pickupFee + dropoffFee + overtimeFee + addonsTotal;

  // ---------- STEP 4: multiplicative (MAX, not product — 09 §9.3.3) ----------
  const applicable: number[] = [];
  for (const m of rules.date_multipliers) {
    if (!isMultiplierApplicable(m, input.tripDate)) continue;
    if (!isKnownNumber(m.factor)) {
      return quoteRequired(input, "UNPRICED_MULTIPLIER:" + m.id, disclaimer);
    }
    applicable.push(m.factor);
  }
  // REGULAR (1.0) is always in the set per rules.json; guard anyway.
  const multiplier = applicable.length ? Math.max(...applicable) : 1;
  const totalBeforeTax = roundUpTo(subtotal * multiplier, rules.rounding.nearest);

  // ---------- STEP 5: tax (blocked on Q3 — is_pkp) ----------
  const ppn = rules.is_pkp ? Math.round(totalBeforeTax * rules.ppn_rate) : 0;
  const total = totalBeforeTax + ppn;

  // ---------- breakdown (09 §9.9 — always show the causal chain) ----------
  const breakdown: BreakdownLine[] = [];
  breakdown.push({
    label: `${corridor.from_city} → ${corridor.to_city} (${vclass.label})`,
    amount: base,
  });
  if (pickupFee > 0) breakdown.push({ label: `Penjemputan ${pickup.label}`, amount: pickupFee });
  if (dropoffFee > 0) breakdown.push({ label: `Pengantaran ${dropoff.label}`, amount: dropoffFee });
  breakdown.push({
    label: `Estimasi ${billableHours} jam kerja`,
    amount: overtimeFee,
    included: overtimeFee === 0,
  });
  for (const line of addonLines) breakdown.push(line);
  if (multiplier > 1) {
    breakdown.push({ label: `Penyesuaian tanggal ×${multiplier}`, amount: totalBeforeTax - roundUpTo(subtotal, rules.rounding.nearest) });
  }
  if (ppn > 0) breakdown.push({ label: "PPN 11%", amount: ppn });

  const { ref, refFull } = computeRef(input);

  return {
    status: "OK",
    subtotal,
    multiplier,
    totalBeforeTax,
    ppn,
    total,
    hours: {
      travelHours,
      dwellHours,
      bufferHours,
      billableHours,
      includedHours: corridor.included_hours,
      withinPackage: overtimeHours === 0,
    },
    breakdown,
    disclaimer,
    ref,
    refFull,
  };
}

function isMultiplierApplicable(
  m: { id: string; days?: string[]; dates?: string[] },
  tripDate?: string,
): boolean {
  if (m.id === "REGULAR") return true;
  if (!tripDate) return false;
  if (m.dates && m.dates.includes(tripDate)) return true;
  if (m.days && m.days.includes(weekdayCode(tripDate))) return true;
  return false;
}

// Re-export a couple of helpers used by consumers (WhatsApp, UI).
export { formatIDR };
