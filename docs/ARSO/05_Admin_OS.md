# 05 — ADMIN OS

**Phase:** 1–2. **GATED.** Nothing here is contracted until Gate 0→1 (`00` §0.3) clears.

---

## 5.1 What replaces this in Phase 0

Nothing. **That is the point.**

At 14 vehicles with 1–2 admins, the Phase 0 "admin console" is:

| Function | Phase 0 tool | Cost |
|---|---|---|
| Quote | Estimator (customer self-serves) + structured WA pre-fill | Rp 0 |
| Availability | Shared Google Calendar, one event per booking | Rp 0 |
| Pricing rules | Google Sheet → CSV → PR → deploy | Rp 0 |
| Invoice | Existing template | Rp 0 |
| Payment verify | Look at BCA mobile | Rp 0 |
| Dispatch | Phone call | Rp 0 |
| Reporting | Spreadsheet | Rp 0 |

**This stack costs nothing, works today, and is faster than any software you could build
for a two-person team.** A shared calendar with disciplined use prevents most
double-bookings. The remaining ones are a *discipline* problem, and software does not fix
discipline — it relocates it.

> The admin console becomes worth building at the point where the human **cannot** hold
> the state anymore. That point is measurable (`00` §0.3), and Arasya is not at it.

---

## 5.2 Design principles (when it is built)

1. **Mirror the SOP, don't reinvent it.** `12_Operations_SOP.md` describes what humans do
   now. The console automates *those steps*. A console that imposes a new workflow gets
   abandoned within a month and you maintain both.
2. **Keyboard-first.** The admin lives in this tool 6 hours a day. Every mouse trip is a
   tax paid hundreds of times per week.
3. **WhatsApp-adjacent, not WhatsApp-replacing.** The console prepares messages; the human
   sends them (`01` §1.3).
4. **One screen for the 80% case.** Quote → confirm → assign, without navigation.
5. **Every override needs a reason.** Not friction — instrumentation (BR-113).

---

## 5.3 Modules (Phase 1)

### 5.3.1 Quote console — the only module that matters

**The 80% flow:** customer WA arrives with a pre-filled `ref`.

```
┌────────────────────────────────────────────────────────────────┐
│ 🔍 [ ref: q-a7f3c1                                    ] Enter  │
├────────────────────────────────────────────────────────────────┤
│ Jakarta (Cibubur) → Bandung (Dago)  · Avanza · One-way         │
│ 12 Agu 2026, 07:00 · 4 pax · 3 titik (meeting)                 │
│                                                                │
│ Base JKT→BDG Economy MPV            700.000                    │
│ Penjemputan Cibubur                 150.000                    │
│ 10 jam kerja                        ✓ termasuk (12j)           │
│ ────────────────────────────────────────────                   │
│ ESTIMASI                            850.000                    │
│                                                                │
│ 💰 Cost floor 612.000 · Margin 28%   ← OWNER/FINANCE only      │
│                                                                │
│ [ Terbitkan Quote ]  [ Override ]  [ Salin ke WA ]             │
└────────────────────────────────────────────────────────────────┘
```

**Pasting a `ref` reconstructs the entire request.** The admin confirms rather than
re-types. **This single interaction is the whole solution to business problem #1** — and
note that 90% of its value already exists in Phase 0 via the pre-fill, with no console at all.

**Margin visibility is the real feature.** The admin currently discounts blind. Showing
the floor turns "customer wants 800" from a gut call into a decision: 800 is still 24%
margin → yes. 600 is below floor → no, and here's why.

**Override flow:** amount → mandatory reason code → confirm. Logged, immutable, superseding.

> **Override rate is a rule-quality metric, not an admin-performance metric.** Never present
> it as the latter — the moment an admin feels judged for overriding, they stop overriding
> and start quoting wrong prices to look compliant. A corridor overridden > 20% of the time
> means **the rule is wrong** (FR-BKG-006). Fix the rule.

### 5.3.2 Booking board
Kanban by status. Drag = status transition. Conflicts rejected by the database, surfaced
with the conflicting booking **named**, not "unavailable."

### 5.3.3 Payment verification
Queue of `PENDING` payments. Side-by-side: expected amount vs. proof image.
`[Verify]` / `[Reject + reason]`. Every action logged.

> **Proof images are specific personal data** (BR-026) — they contain account numbers.
> Separate bucket, separate key, `FINANCE`/`OWNER` only, short-lived signed URLs.
> This screen is the highest-sensitivity surface in the entire system, and it looks like
> the most boring one. Treat it accordingly.

### 5.3.4 Pricing admin
CRUD over `corridor_prices` and `pricing_rules`, honouring `07` §7.4:
- Never `UPDATE`. Always supersede with `effective_from`.
- `reason` mandatory.
- **Publish runs the §9.7 backtest. Failing backtest → publish rejected.**
- Rollback in < 5 min, by a non-developer (NFR-SUP-002).
- Any price below `cost_floor` requires an explicit `loss_leader` checkbox + reason.

> This module is the reason `pricing_rules` is versioned. Without versioning, a Tuesday
> price edit silently rewrites what a Monday customer was quoted — and you lose every
> dispute, forever, because you cannot prove what the price was.

### 5.3.5 Dispatch board (Phase 2)
Timeline: vehicles × time. Blocked periods include buffers, **rendered visibly** — the
dispatcher must *see* that a car finishing in Bandung at 18:00 is not free at 19:00.
Manual assignment. No auto-dispatch: a human who knows that this driver is good with
corporate clients and that one knows the Ciwidey road beats an optimiser at 14 vehicles.

### 5.3.6 Fleet & reports (Phase 2)
- Document expiry (STNK/KIR/insurance/permit) — 60/30/7-day alerts. Each alert names an owner.
- Per-vehicle contribution, **worst first** (`10` §10.4).
- Margin by corridor — a `SELECT` on `quotes.margin_pct`, already free from `07` §7.5.

---

## 5.4 RBAC

| Role | Scope |
|---|---|
| `OWNER` | Everything incl. margin, salary, pricing publish |
| `ADMIN` | Quotes, bookings, customers. **No margin, no salary.** |
| `FINANCE` | Invoices, payments, proofs, salary, margin |
| `DISPATCH` | Assignments, availability. **No pricing, no financials.** |
| `DRIVER` | Own assignments only |
| `READONLY` | Non-financial reports |

Column-level: `drivers.base_salary_idr` → `FINANCE`/`OWNER` (NFR-SEC-005).
2FA on all roles above `DRIVER`.

> **`ADMIN` cannot see margin, by design.** An admin who knows the floor negotiates to the
> floor. The owner decides the discount band; the admin works inside it. This is a business
> rule expressed as an access rule — and it is the kind of thing that is trivial to build on
> day one and structurally impossible to retrofit once everyone has been looking at margin
> for a year.

---

## 5.5 What is explicitly NOT in the admin console

| Not building | Why |
|---|---|
| Auto-dispatch | A human beats an optimiser at 14 vehicles |
| Chat inbox / WA integration in-console | Do not rebuild WhatsApp. Deep-link out. |
| Customer CRM with pipelines | Not a sales org |
| Custom report builder | Metabase, Phase 2, or a `SELECT` |
| Mobile admin app | Responsive web. Two users. |
| Real-time collaborative editing | Two users. |
| Notifications engine with templates | Three message types, hardcoded, until proven otherwise |

---

## 5.6 Acceptance (Phase 1)

- [ ] Pasting a `ref` reconstructs the full request — zero re-typing
- [ ] Override impossible without a reason code
- [ ] Quote issue freezes `rule_version_id`; row immutable at the DB
- [ ] Concurrent assignment: exactly one succeeds, other sees the named conflict
- [ ] Pricing publish rejected on backtest failure
- [ ] Rollback demonstrated by a non-developer in < 5 min
- [ ] `ADMIN` role cannot see margin or salary — verified by access test
- [ ] Proof images unreachable without a signed, expiring URL
- [ ] 80% flow (quote → confirm → assign) completes without leaving one screen

---

*End 05.*
