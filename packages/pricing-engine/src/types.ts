// ARSO Pricing Engine — type contracts (09_Pricing_Engine.md).
// Erasable TypeScript only (runs under `node --experimental-strip-types`):
// no enums, no namespaces, no parameter properties.

/** A price cell in the rule data. A real number is priceable; `null` is a
 * deliberate business decision (quote-only); any string (e.g. "{{TOKEN}}") is
 * an unresolved value that MUST NOT be turned into a displayed number. */
export type PriceCell = number | null | string;

export type TripType = "ONE_WAY" | "ROUND_TRIP";

export type StopType =
  | "DROP_ONLY"
  | "PICKUP_ONLY"
  | "SHORT_WAIT"
  | "MEETING"
  | "MEAL"
  | "LONG_WAIT";

export interface VehicleClass {
  id: string;
  label: string;
  pax: number;
  vehicles: string[];
  quote_only?: boolean;
}

export interface Zone {
  id: string;
  city: string;
  label: string;
  pickup_fee?: PriceCell;
  dropoff_fee?: PriceCell;
  deadhead_km_from_hq?: PriceCell;
  basis?: string;
  quote_only?: boolean;
}

export interface Corridor {
  id: string;
  from_city: string;
  to_city: string;
  reference_origin: string;
  reference_destination: string;
  km: PriceCell;
  toll: PriceCell;
  travel_hours: number;
  buffer_hours: number;
  included_hours: number;
  price: Record<string, Record<TripType, PriceCell>>;
}

export interface DateMultiplier {
  id: string;
  factor: PriceCell;
  days?: string[]; // e.g. ["SA","SU"]
  dates?: string[]; // explicit ISO dates (YYYY-MM-DD)
}

export interface Addon {
  price: PriceCell;
  unit?: string;
  condition?: string;
  type?: string;
}

export interface Rules {
  overtime_per_hour: Record<string, PriceCell>;
  stop_type_dwell_hours: Record<StopType, number>;
  addons: Record<string, Addon>;
  date_multipliers: DateMultiplier[];
  multiplier_policy: string;
  rounding: { mode: string; nearest: number };
  ppn_rate: number;
  is_pkp: boolean;
  estimate_disclaimer_required: boolean;
  estimate_disclaimer_id: string;
}

export interface RuleSet {
  vehicle_classes: VehicleClass[];
  zones: Zone[];
  corridors: Corridor[];
  rules: Rules;
}

export interface Stop {
  type: StopType;
}

/** Everything the engine needs. No clock, no I/O — the trip date is injected. */
export interface EstimateInput {
  corridorId: string;
  vehicleClassId: string;
  tripType: TripType;
  pickupZoneId: string;
  dropoffZoneId: string;
  stops: Stop[];
  addonIds?: string[];
  /** ISO date (YYYY-MM-DD) of the trip. Injected — the engine never reads a clock. */
  tripDate?: string;
  /** Passenger count — used only for the WhatsApp prefill, never for price. */
  pax?: number;
  /** Pickup time "HH:MM" — used only for the WhatsApp prefill. */
  pickupTime?: string;
}

export interface BreakdownLine {
  label: string;
  amount: number; // rupiah; 0 allowed (e.g. "termasuk")
  included?: boolean; // true => shown as "✓ termasuk", not a charge
}

export interface HoursExplanation {
  travelHours: number;
  dwellHours: number;
  bufferHours: number;
  billableHours: number;
  includedHours: number;
  withinPackage: boolean;
}

export type EstimateStatus = "OK" | "QUOTE_REQUIRED";

export interface EstimateOk {
  status: "OK";
  totalBeforeTax: number;
  ppn: number;
  total: number;
  subtotal: number;
  multiplier: number;
  hours: HoursExplanation;
  breakdown: BreakdownLine[];
  disclaimer: string;
  ref: string; // short deterministic id, e.g. "q-a7f3c1"
  refFull: string; // "JKT_BDG/ECONOMY_MPV/ONE_WAY/20260812/q-a7f3c1"
}

export interface EstimateQuoteRequired {
  status: "QUOTE_REQUIRED";
  reason: string;
  disclaimer: string;
  ref: string;
  refFull: string;
}

export type EstimateResult = EstimateOk | EstimateQuoteRequired;
