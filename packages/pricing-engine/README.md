# @swift-rental/pricing-engine

The ARSO **zone-graph additive pricing engine** — the core IP of the whole system
(`docs/ARSO/09_Pricing_Engine.md`). Per **ADR-006**, this is *one* implementation,
shared by the public-site estimator and (Phase 1) the backend. Re-implementing it
server-side "for security" produces two engines that drift, and the day they disagree
the customer sees one number on the site and a different one on the invoice — which
destroys the trust the business is built on.

## Design guarantees (09 §9.12)

- **Pure function.** `estimate(input, ruleSet)` — no I/O, no clock, no network. The
  trip date and the rules are injected. The engine never reads the filesystem; only
  test/CLI helpers do.
- **Deterministic.** Same input → same output, always (property-tested, 1000×).
- **Never guesses.** A `null` cell (a business decision: quote-only) and a `"{{TOKEN}}"`
  cell (an unresolved value) both short-circuit to `QUOTE_REQUIRED`. No unresolved value
  is ever reachable as a displayed price.
- **`max`, not product**, for date multipliers (§9.3.3) — stacking is how a pricing
  engine silently destroys a trust-based business.
- **Round-up only** to the nearest 10.000 (§9.9) — the operator can only ever discount
  from the screen price, never surprise the customer upward.

## Layout

```
data/         the 4 rule files (§9.8): vehicle_classes, zones, corridors, rules
src/          engine.ts (pure fn), whatsapp.ts (§9.10 prefill), util, types, loader
test/         unit + property (monotonicity/determinism/rounding) tests
scripts/      validate.ts (§9.8), backtest.ts (§9.7 gate), demo.ts
backtest/     fixtures.json — the calibration dataset
```

## Run (no install — Node ≥22.6 strips types natively)

```bash
npm test          # unit + property tests
npm run validate  # rule-data structural + coverage report
npm run backtest  # calibration gate (09 §9.7)
npm run demo      # human-readable end-to-end
npm run check     # all of the above (this is the CI gate — 06 §6.6)
```

## Status of the data (what is real vs pending)

The engine is complete; the **rule data is intentionally sparse** and honest about it.
Only `JKT_BDG / ECONOMY_MPV / ONE_WAY = 700.000` (and the confirmed zone fees) are real.
Everything else is `{{TOKEN}}` (unknown — blocked on client data Q4/Q5/Q7) or `null`
(quote-only). Those paths correctly return `QUOTE_REQUIRED` today. Filling them in is a
data task, not a code task: edit the JSON → `npm run check` → commit.

See [`FINDINGS.md`](./FINDINGS.md) for spec discrepancies surfaced while building.
