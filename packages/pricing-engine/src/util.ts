// Pure helpers for the pricing engine. No I/O, no clock.

import type { PriceCell } from "./types.ts";

/** A cell is "known" only if it is a finite number. `null` and any string
 * (including "{{TOKEN}}") are NOT known and must never become a displayed price. */
export function isKnownNumber(v: PriceCell | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** True when the value is an unresolved token (a non-numeric, non-null string). */
export function isToken(v: PriceCell | undefined): boolean {
  return typeof v === "string";
}

/** Round UP to the nearest `nearest` (09 §9.9 — round-up-only). */
export function roundUpTo(value: number, nearest: number): number {
  if (nearest <= 0) return value;
  return Math.ceil(value / nearest) * nearest;
}

/** Ceiling of billable hours (09 §9.3.1). */
export function ceilHours(h: number): number {
  return Math.ceil(h - 1e-9); // guard fp noise so 10.0 stays 10, not 11
}

/** Format rupiah like the site: "Rp 850.000". */
export function formatIDR(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

/** Deterministic 32-bit FNV-1a hash → 6 hex chars. No PII in, no PII out. */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0 to keep unsigned, then take 6 hex chars
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 6);
}

/** Two-letter weekday code (SU, MO, TU, WE, TH, FR, SA) for an ISO date.
 * Uses UTC parsing so it is deterministic regardless of host timezone. */
export function weekdayCode(isoDate: string): string {
  const codes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const d = new Date(isoDate + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "";
  return codes[d.getUTCDay()];
}
