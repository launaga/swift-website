# Pricing-engine findings

Discrepancies surfaced while implementing `docs/ARSO/09_Pricing_Engine.md` to the
letter. Per §9.7, "a backtest miss is not an engine bug by default — either the rule is
missing or the historical number was wrong. Both are findings." Same spirit here.

## F-1 — Worked-example hours arithmetic (§9.3.2 / §9.4.1)

The doc annotates the JKT→BDG example as:

> travel 3.5h + dwell (3 × 1.5h) + buffer 1h = **9.5h → 10h**
> and the display contract shows "Estimasi **10 jam kerja**".

But `3.5 + (3 × 1.5) + 1.0 = 9.0`, and the normative formula is
`billable = ceil(travel + dwell + buffer) = ceil(9.0) = 9`.

- The **"9.5h"** and **"10 jam"** are an arithmetic slip in the prose.
- **Price impact: none.** Billable (9 or 10) is ≤ the 12h included, so overtime = 0 and
  the estimate is Rp 850.000 either way — the calibration anchor still matches the
  client's manual quote.
- **Decision taken:** follow the formula (9h). The engine displays "9 jam kerja". If the
  business genuinely wants a larger implicit buffer, raise `corridor.buffer_hours`
  (a data change), don't hard-code a wrong number.

## F-2 — Reference-destination zone id (§9.4.2 vs §9.8)

`corridors.json` sets `reference_destination = "ZONE_BANDUNG_KOTA"`, but the `zones.json`
example in the doc defines `ZONE_DAGO` as `basis: "REFERENCE_DESTINATION"` and never
defines `ZONE_BANDUNG_KOTA`.

- **Decision taken:** added `ZONE_BANDUNG_KOTA` (dropoff_fee 0, the reference), and kept
  `ZONE_DAGO` with dropoff_fee 0 (`basis: AT_REFERENCE`). Both yield the same 0 deviation,
  so the worked example (dropoff Dago → +0) is unaffected. Confirm with client which is
  the true reference label.

## F-3 — Every priceable cell but one is a token (expected, flagged)

`npm run validate` reports 9 `{{TOKEN}}` corridor cells + token zone fees. This is
**correct and expected** at this stage (blocked on Q4/Q5/Q7), not a defect — the engine
routes all of them to `QUOTE_REQUIRED`. Listed here so it is a conscious state, not a
silent gap. `{{TOKEN}}` in a *production* path would be a bug; here they are unreachable
as displayed prices by construction.
