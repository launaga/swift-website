// ARSO API service layer (08_API_Spec.yaml). The thin seam that composes the two
// tested layers: it reuses the pricing engine (packages/pricing-engine, ADR-006)
// and writes to the schema (packages/db), enforcing the business rules the DB
// can't express on its own (DP = 20%, quote freezes a rule version, etc.).
//
// Driver-agnostic: every function takes a `q` (parameterised query runner), so
// it works with node-postgres in prod and the test cluster in CI.

import { estimate } from "../../pricing-engine/src/engine.ts";
import type { EstimateInput, RuleSet, EstimateResult } from "../../pricing-engine/src/types.ts";

export interface Query {
  (sql: string, params?: unknown[]): Promise<{ rows: any[] }>;
}

const DP_RATE = 0.2; // 20% deposit per current SOP (07 §7.7 dp_required_idr)

/** POST /estimates — non-binding, ephemeral (09 §9.9). Pure engine call. */
export function createEstimate(input: EstimateInput, ruleset: RuleSet): EstimateResult {
  return estimate(input, ruleset);
}

/** POST /quotes — issue a binding, immutable quote (08 createQuote, 07 §7.5).
 * The quote freezes the rule_version that produced it; the row is immutable at
 * the DB (rewrite RULE), so we never UPDATE it — corrections supersede. */
export async function issueQuote(
  q: Query,
  args: {
    input: EstimateInput;
    ruleset: RuleSet;
    ruleVersionId: string;
    tier: "DALAM_KOTA_12H" | "ALL_IN";
    costFloorIdr?: number | null;
    createdBy?: string | null;
  },
): Promise<{ id: string; code: string; total_idr: number }> {
  const r = createEstimate(args.input, args.ruleset);
  if (r.status !== "OK") {
    throw new ApiError("QUOTE_ONLY", `input is not priceable: ${r.reason}`);
  }
  const code = await nextCode(q, "QT");
  const { input } = args;
  const rows = (await q(
    `INSERT INTO quotes (
       code, ref_hash, rule_version_id, corridor_id, class_id, trip_type, tier,
       pickup_zone_id, dropoff_zone_id, trip_date, pickup_time, pax,
       billable_hours, breakdown, subtotal_idr, date_multiplier, ppn_idr, total_idr,
       cost_floor_idr, expires_at, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, now() + interval '2 days', $20)
     RETURNING id, code, total_idr`,
    [
      code, r.ref, args.ruleVersionId, input.corridorId, input.vehicleClassId, input.tripType, args.tier,
      input.pickupZoneId, input.dropoffZoneId, input.tripDate ?? null, input.pickupTime ?? "07:00", input.pax ?? 1,
      r.hours.billableHours, JSON.stringify(r.breakdown), r.subtotal, r.multiplier, r.ppn, r.total,
      args.costFloorIdr ?? null, args.createdBy ?? null,
    ],
  )).rows;
  return rows[0];
}

/** POST /bookings — create a booking from an issued quote (08 createBooking). */
export async function createBooking(
  q: Query,
  args: {
    quoteId: string; customerId: string; scheduledStart: string; scheduledEnd: string;
    pickupZoneId: string; dropoffZoneId: string; totalIdr: number; companyId?: string | null;
  },
): Promise<{ id: string; code: string }> {
  const code = await nextCode(q, "BK");
  const rows = (await q(
    `INSERT INTO bookings (code, quote_id, customer_id, company_id, status,
       scheduled_start, scheduled_end, pickup_zone_id, dropoff_zone_id, total_idr)
     VALUES ($1,$2,$3,$4,'PENDING_PAYMENT',$5,$6,$7,$8,$9)
     RETURNING id, code`,
    [code, args.quoteId, args.customerId, args.companyId ?? null,
     args.scheduledStart, args.scheduledEnd, args.pickupZoneId, args.dropoffZoneId, args.totalIdr],
  )).rows;
  return rows[0];
}

/** Issue the invoice with the 20% DP computed here — the rule the DB can't hold. */
export async function issueInvoice(
  q: Query,
  args: { bookingId: string; subtotalIdr: number; ppnIdr?: number },
): Promise<{ id: string; code: string; dp_required_idr: number }> {
  const ppn = args.ppnIdr ?? 0;
  const total = args.subtotalIdr + ppn;
  const dp = Math.round((total * DP_RATE) / 10000) * 10000; // round to 10k like the estimate
  const code = await nextCode(q, "INV");
  const rows = (await q(
    `INSERT INTO invoices (code, booking_id, status, subtotal_idr, ppn_idr, total_idr, dp_required_idr, issued_at)
     VALUES ($1,$2,'ISSUED',$3,$4,$5,$6, now())
     RETURNING id, code, dp_required_idr`,
    [code, args.bookingId, args.subtotalIdr, ppn, total, dp],
  )).rows;
  return rows[0];
}

/** POST /assignments — the exclusion constraint (07 §7.6.1) does the real work.
 * A conflicting insert raises SQLSTATE 23P01; we translate it to a 409-style
 * ApiError naming that this is a double-booking (08 createAssignment → 409). */
export async function createAssignment(
  q: Query,
  args: {
    bookingId: string; vehicleId: string; driverId: string;
    blockedPeriod: string; assignedBy: string;
  },
): Promise<{ id: string }> {
  try {
    const rows = (await q(
      `INSERT INTO assignments (booking_id, vehicle_id, driver_id, blocked_period, assigned_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [args.bookingId, args.vehicleId, args.driverId, args.blockedPeriod, args.assignedBy],
    )).rows;
    await q(`UPDATE bookings SET status = 'ASSIGNED' WHERE id = $1`, [args.bookingId]);
    return rows[0];
  } catch (e: any) {
    if (e && e.code === "23P01") {
      throw new ApiError("DOUBLE_BOOKING", "vehicle or driver already has an overlapping assignment", 409);
    }
    throw e;
  }
}

export class ApiError extends Error {
  code: string;
  httpStatus: number;
  constructor(code: string, message: string, httpStatus = 422) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/** Gapless, human-readable codes (07 §7.1). Uses a per-prefix counter table. */
async function nextCode(q: Query, prefix: string): Promise<string> {
  const year = new Date().getUTCFullYear();
  const rows = (await q(
    `INSERT INTO code_counters (prefix, year, n) VALUES ($1,$2,1)
     ON CONFLICT (prefix, year) DO UPDATE SET n = code_counters.n + 1
     RETURNING n`,
    [prefix, year],
  )).rows;
  return `${prefix}-${year}-${String(rows[0].n).padStart(5, "0")}`;
}
