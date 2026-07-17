// WhatsApp pre-fill contract (09_Pricing_Engine.md §9.10).
// The structured message that turns a 5-message interrogation into a 1-message
// confirmation. This — not a booking engine — is what kills problem #1 (01 §1.3).

import type {
  Corridor,
  EstimateInput,
  EstimateResult,
  RuleSet,
  VehicleClass,
  Zone,
} from "./types.ts";
import { formatIDR } from "./util.ts";

const WA_PRIMARY = "6282124024281";

const STOP_LABEL: Record<string, string> = {
  DROP_ONLY: "turun",
  PICKUP_ONLY: "jemput",
  SHORT_WAIT: "singgah",
  MEETING: "meeting",
  MEAL: "makan",
  LONG_WAIT: "acara",
};

function idDate(iso?: string): string {
  if (!iso) return "(tanggal menyusul)";
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function find<T extends { id: string }>(list: T[], id: string): T | undefined {
  return list.find((x) => x.id === id);
}

/** Build the exact §9.10 message body (without URL-encoding). */
export function buildWhatsAppMessage(
  input: EstimateInput,
  result: EstimateResult,
  data: RuleSet,
): string {
  const corridor = find(data.corridors, input.corridorId) as Corridor | undefined;
  const vclass = find(data.vehicle_classes, input.vehicleClassId) as VehicleClass | undefined;
  const pickup = find(data.zones, input.pickupZoneId) as Zone | undefined;
  const dropoff = find(data.zones, input.dropoffZoneId) as Zone | undefined;

  const routeFrom = corridor
    ? `${corridor.from_city} (${pickup?.label ?? "?"})`
    : (pickup?.label ?? "?");
  const routeTo = corridor
    ? `${corridor.to_city} (${dropoff?.label ?? "?"})`
    : (dropoff?.label ?? "?");

  const vehLabel = vclass
    ? `${vclass.vehicles[0]} (${vclass.label})`
    : input.vehicleClassId;

  const dateLine = input.pickupTime
    ? `${idDate(input.tripDate)}, jemput ${input.pickupTime}`
    : idDate(input.tripDate);

  const stopCity = corridor?.to_city ?? "tujuan";
  const stopTypes = input.stops.map((s) => STOP_LABEL[s.type] ?? s.type);
  const stopLine = input.stops.length
    ? `${input.stops.length} titik di ${stopCity} (${uniqueJoin(stopTypes)})`
    : "langsung, tanpa titik tambahan";

  const tripLabel = input.tripType === "ROUND_TRIP" ? "Pulang pergi" : "Sekali jalan";

  const estLine =
    result.status === "OK"
      ? `${formatIDR(result.total)} (belum termasuk BBM/toll/parkir/makan driver)`
      : "Hubungi kami untuk harga terbaik";

  const paxLine = input.pax ? `${input.pax} orang` : "(jumlah menyusul)";

  return [
    "Halo Arasya, saya mau booking:",
    "",
    `Rute      : ${routeFrom} → ${routeTo}`,
    `Tanggal   : ${dateLine}`,
    `Kendaraan : ${vehLabel}`,
    `Penumpang : ${paxLine}`,
    `Titik     : ${stopLine}`,
    `Tipe      : ${tripLabel}`,
    `Estimasi  : ${estLine}`,
    "",
    `(ref: ${result.refFull})`,
  ].join("\n");
}

/** Full https://wa.me link with the encoded message. */
export function buildWhatsAppUrl(
  input: EstimateInput,
  result: EstimateResult,
  data: RuleSet,
  phone: string = WA_PRIMARY,
): string {
  const msg = buildWhatsAppMessage(input, result, data);
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

/** The analytics event payload (09 §9.10) — zero PII by construction. */
export function whatsappClickEvent(
  input: EstimateInput,
  result: EstimateResult,
): Record<string, string | number> {
  return {
    corridor: input.corridorId,
    vehicle_class: input.vehicleClassId,
    trip_type: input.tripType,
    estimate_idr: result.status === "OK" ? result.total : 0,
    ref: result.ref,
  };
}

function uniqueJoin(items: string[]): string {
  return Array.from(new Set(items)).join(", ");
}
