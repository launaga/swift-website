# ARSO Console (admin)

A **functional, self-contained** admin for `docs/ARSO/05_Admin_OS.md`, deployed as a static
app at `/admin/`. **Phase 1 — gated** (`docs/ARSO/00` §0.3); this is a portfolio/reference
build, not a production console.

## What makes it real

- It runs the **actual pricing engine** — `admin/lib/pricing-engine.js` is bundled straight
  from `packages/pricing-engine` (see `build.sh`). No re-implementation, so the admin and
  the backend can never disagree (**ADR-006**).
- Every workflow from §5.3 is here and works:
  - **Quote Console** (§5.3.1) — paste a `ref`, the whole request reconstructs; the engine
    prices it; **margin + cost floor show only for OWNER/FINANCE** (§5.4 — an ADMIN who sees
    the floor negotiates to it); Issue Quote (freezes rule version), Override (mandatory
    reason), Copy to WhatsApp.
  - **Booking Board** (§5.3.2) — kanban by status, drag to transition; assigning a unit runs
    the buffer-padded overlap check and **names the conflicting booking** if any.
  - **Payment verification** (§5.3.3) — PENDING queue, verify / reject+reason, FINANCE/OWNER only.
  - **Pricing admin** (§5.3.4) — supersede (never update) + mandatory reason; **Publish runs
    the §9.7 backtest and is rejected if the calibration anchor drifts >10%**.
  - **Reports** (§5.3.6) — margin-by-corridor heatmap (worst first), document-expiry alerts,
    audit log.
- **RBAC** is a live switcher (OWNER / ADMIN / FINANCE / DISPATCH). Flip it to see margin,
  payments, and pricing-publish appear and disappear per §5.4.
- **Keyboard-first** (§5.2): `1–5` switch modules, `/` jumps to the ref box, `Enter` searches.

## Data

Persisted in `localStorage`, seeded from `data/seed.json`. **The prices/costs in the seed
are synthetic demo data** (clearly banner-flagged) so the console has something to render —
real numbers are blocked on client data (Q4/Q5/Q7). The engine and the workflows are real;
only the inputs are a fixture. "Reset data demo" reseeds.

## Rebuild the engine bundle

```bash
admin/build.sh        # re-bundles packages/pricing-engine → admin/lib/pricing-engine.js
```

The committed bundle means the static deploy needs no build step.
