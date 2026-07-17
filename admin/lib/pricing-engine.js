// packages/pricing-engine/src/util.ts
function isKnownNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function isToken(v) {
  return typeof v === "string";
}
function roundUpTo(value, nearest) {
  if (nearest <= 0) return value;
  return Math.ceil(value / nearest) * nearest;
}
function ceilHours(h) {
  return Math.ceil(h - 1e-9);
}
function formatIDR(n) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
function fnv1a(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 6);
}
function weekdayCode(isoDate) {
  const codes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const d = /* @__PURE__ */ new Date(isoDate + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "";
  return codes[d.getUTCDay()];
}

// packages/pricing-engine/src/engine.ts
function byId(list, id) {
  return list.find((x) => x.id === id);
}
function computeRef(input) {
  const canonical = JSON.stringify({
    c: input.corridorId,
    v: input.vehicleClassId,
    t: input.tripType,
    pu: input.pickupZoneId,
    do: input.dropoffZoneId,
    s: input.stops.map((s) => s.type),
    a: (input.addonIds ?? []).slice().sort(),
    d: input.tripDate ?? ""
  });
  const ref = "q-" + fnv1a(canonical);
  const datePart = (input.tripDate ?? "").replace(/-/g, "");
  const refFull = [
    input.corridorId,
    input.vehicleClassId,
    input.tripType,
    datePart,
    ref
  ].join("/");
  return { ref, refFull };
}
function quoteRequired(input, reason, disclaimer) {
  const { ref, refFull } = computeRef(input);
  return { status: "QUOTE_REQUIRED", reason, disclaimer, ref, refFull };
}
function estimate(input, data) {
  const { rules } = data;
  const disclaimer = rules.estimate_disclaimer_id;
  const corridor = byId(data.corridors, input.corridorId);
  const vclass = byId(
    data.vehicle_classes,
    input.vehicleClassId
  );
  const pickup = byId(data.zones, input.pickupZoneId);
  const dropoff = byId(data.zones, input.dropoffZoneId);
  if (!corridor) return quoteRequired(input, "UNKNOWN_CORRIDOR", disclaimer);
  if (!vclass) return quoteRequired(input, "UNKNOWN_VEHICLE_CLASS", disclaimer);
  if (!pickup) return quoteRequired(input, "UNKNOWN_PICKUP_ZONE", disclaimer);
  if (!dropoff) return quoteRequired(input, "UNKNOWN_DROPOFF_ZONE", disclaimer);
  if (vclass.quote_only) return quoteRequired(input, "QUOTE_ONLY_CLASS", disclaimer);
  if (pickup.quote_only) return quoteRequired(input, "QUOTE_ONLY_PICKUP", disclaimer);
  if (dropoff.quote_only) return quoteRequired(input, "QUOTE_ONLY_DROPOFF", disclaimer);
  const baseCell = corridor.price?.[input.vehicleClassId]?.[input.tripType];
  if (baseCell === null) {
    return quoteRequired(input, "QUOTE_ONLY_CORRIDOR_CLASS", disclaimer);
  }
  if (!isKnownNumber(baseCell)) {
    return quoteRequired(input, "UNPRICED_CORRIDOR_CLASS", disclaimer);
  }
  const base = baseCell;
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
      return quoteRequired(input, "UNPRICED_OVERTIME", disclaimer);
    }
    overtimeFee = overtimeHours * rate;
  }
  let addonsTotal = 0;
  const addonLines = [];
  for (const addonId of input.addonIds ?? []) {
    const addon = rules.addons[addonId];
    if (!addon || !isKnownNumber(addon.price)) {
      return quoteRequired(input, "UNPRICED_ADDON:" + addonId, disclaimer);
    }
    addonsTotal += addon.price;
    addonLines.push({ label: addonId, amount: addon.price });
  }
  const subtotal = base + pickupFee + dropoffFee + overtimeFee + addonsTotal;
  const applicable = [];
  for (const m of rules.date_multipliers) {
    if (!isMultiplierApplicable(m, input.tripDate)) continue;
    if (!isKnownNumber(m.factor)) {
      return quoteRequired(input, "UNPRICED_MULTIPLIER:" + m.id, disclaimer);
    }
    applicable.push(m.factor);
  }
  const multiplier = applicable.length ? Math.max(...applicable) : 1;
  const totalBeforeTax = roundUpTo(subtotal * multiplier, rules.rounding.nearest);
  const ppn = rules.is_pkp ? Math.round(totalBeforeTax * rules.ppn_rate) : 0;
  const total = totalBeforeTax + ppn;
  const breakdown = [];
  breakdown.push({
    label: `${corridor.from_city} \u2192 ${corridor.to_city} (${vclass.label})`,
    amount: base
  });
  if (pickupFee > 0) breakdown.push({ label: `Penjemputan ${pickup.label}`, amount: pickupFee });
  if (dropoffFee > 0) breakdown.push({ label: `Pengantaran ${dropoff.label}`, amount: dropoffFee });
  breakdown.push({
    label: `Estimasi ${billableHours} jam kerja`,
    amount: overtimeFee,
    included: overtimeFee === 0
  });
  for (const line of addonLines) breakdown.push(line);
  if (multiplier > 1) {
    breakdown.push({ label: `Penyesuaian tanggal \xD7${multiplier}`, amount: totalBeforeTax - roundUpTo(subtotal, rules.rounding.nearest) });
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
      withinPackage: overtimeHours === 0
    },
    breakdown,
    disclaimer,
    ref,
    refFull
  };
}
function isMultiplierApplicable(m, tripDate) {
  if (m.id === "REGULAR") return true;
  if (!tripDate) return false;
  if (m.dates && m.dates.includes(tripDate)) return true;
  if (m.days && m.days.includes(weekdayCode(tripDate))) return true;
  return false;
}

// packages/pricing-engine/src/loader.ts
function buildRuleSet(vehicleClasses, zones, corridors, rules) {
  return {
    vehicle_classes: vehicleClasses,
    zones,
    corridors,
    rules
  };
}

// packages/pricing-engine/src/whatsapp.ts
var WA_PRIMARY = "6282124024281";
var STOP_LABEL = {
  DROP_ONLY: "turun",
  PICKUP_ONLY: "jemput",
  SHORT_WAIT: "singgah",
  MEETING: "meeting",
  MEAL: "makan",
  LONG_WAIT: "acara"
};
function idDate(iso) {
  if (!iso) return "(tanggal menyusul)";
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];
  const d = /* @__PURE__ */ new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function find(list, id) {
  return list.find((x) => x.id === id);
}
function buildWhatsAppMessage(input, result, data) {
  const corridor = find(data.corridors, input.corridorId);
  const vclass = find(data.vehicle_classes, input.vehicleClassId);
  const pickup = find(data.zones, input.pickupZoneId);
  const dropoff = find(data.zones, input.dropoffZoneId);
  const routeFrom = corridor ? `${corridor.from_city} (${pickup?.label ?? "?"})` : pickup?.label ?? "?";
  const routeTo = corridor ? `${corridor.to_city} (${dropoff?.label ?? "?"})` : dropoff?.label ?? "?";
  const vehLabel = vclass ? `${vclass.vehicles[0]} (${vclass.label})` : input.vehicleClassId;
  const dateLine = input.pickupTime ? `${idDate(input.tripDate)}, jemput ${input.pickupTime}` : idDate(input.tripDate);
  const stopCity = corridor?.to_city ?? "tujuan";
  const stopTypes = input.stops.map((s) => STOP_LABEL[s.type] ?? s.type);
  const stopLine = input.stops.length ? `${input.stops.length} titik di ${stopCity} (${uniqueJoin(stopTypes)})` : "langsung, tanpa titik tambahan";
  const tripLabel = input.tripType === "ROUND_TRIP" ? "Pulang pergi" : "Sekali jalan";
  const estLine = result.status === "OK" ? `${formatIDR(result.total)} (belum termasuk BBM/toll/parkir/makan driver)` : "Hubungi kami untuk harga terbaik";
  const paxLine = input.pax ? `${input.pax} orang` : "(jumlah menyusul)";
  return [
    "Halo Arasya, saya mau booking:",
    "",
    `Rute      : ${routeFrom} \u2192 ${routeTo}`,
    `Tanggal   : ${dateLine}`,
    `Kendaraan : ${vehLabel}`,
    `Penumpang : ${paxLine}`,
    `Titik     : ${stopLine}`,
    `Tipe      : ${tripLabel}`,
    `Estimasi  : ${estLine}`,
    "",
    `(ref: ${result.refFull})`
  ].join("\n");
}
function buildWhatsAppUrl(input, result, data, phone = WA_PRIMARY) {
  const msg = buildWhatsAppMessage(input, result, data);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
function whatsappClickEvent(input, result) {
  return {
    corridor: input.corridorId,
    vehicle_class: input.vehicleClassId,
    trip_type: input.tripType,
    estimate_idr: result.status === "OK" ? result.total : 0,
    ref: result.ref
  };
}
function uniqueJoin(items) {
  return Array.from(new Set(items)).join(", ");
}
export {
  buildRuleSet,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  estimate,
  formatIDR,
  isKnownNumber,
  isToken,
  roundUpTo,
  whatsappClickEvent
};
