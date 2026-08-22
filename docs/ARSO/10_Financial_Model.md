# 10 — FINANCIAL MODEL

**Status:** Decision input. Gates Phase 1 and Phase 2.
**Nature:** A **parameterised model**, not a projection.
**Hard rule:** every number below is `{{TOKEN}}` or `[ASUMSI]`. There are no invented
figures in this document, and none may be added. A financial model with fabricated
inputs is a slide, not an analysis.

---

## 10.1 What this document refuses to do

It does not contain a hockey-stick revenue chart. It does not project three years of
growth. Nobody knows Swift Rental's current utilization (Q7), so any such chart would be
fiction dressed as diligence — and it would be believed, which is worse.

What it contains instead:
1. The **structure** of the economics, so real numbers can be dropped in.
2. **Threshold formulas** — "ARSO pays back only if X" — which are true *regardless* of
   the unknowns and therefore usable **today**.
3. The **two findings** that survive the missing data (§10.5, §10.6).

Fill in `{{TOKEN}}` from Q2/Q5/Q7 and this becomes a real model in an afternoon.

---

## 10.2 Layer 1 — unit economics per trip

```
revenue          = quote.total_idr

variable_cost    = fuel + tolls + driver_trip_pay + meals + parking + stay
                   ├─ fuel     = total_km × fuel_per_km          # total_km INCLUDES deadhead
                   ├─ tolls    = corridor.toll (+ deadhead tolls)
                   ├─ driver   = billable_hours × driver_hourly_loaded
                   ├─ meals    = all_in ? driver_meal : 0
                   └─ stay     = overnight_nights × driver_stay_cost

contribution     = revenue − variable_cost
contribution_pct = contribution / revenue

# Semi-variable — real, per-km, but felt only at resale:
wear_cost        = total_km × (tyre_per_km + service_per_km + depreciation_per_km)

true_margin      = contribution − wear_cost
```

### Parameter table — fill this first, before anything else

| Param | Value | Source | Status |
|---|---|---|---|
| `fuel_per_km` (per class) | `{{TOKEN}}` | fuel receipts ÷ odometer delta, 3 months | Q5 |
| `driver_hourly_loaded` | `{{TOKEN}}` | see §10.3 — **do not shortcut this** | Q5 |
| `tyre_per_km` | `{{TOKEN}}` | tyre cost ÷ rated km | Q5 |
| `service_per_km` | `{{TOKEN}}` | 12-mo service spend ÷ km driven | Q5 |
| `depreciation_per_km` | `{{TOKEN}}` | **meaningless if PARTNER-owned** | **Q2** |
| `corridor.toll` | `{{TOKEN}}` | e-toll statements | Q5 |
| `driver_meal` | `{{TOKEN}}` | | Q5 |
| `driver_stay_cost` | `{{TOKEN}}` | | Q5 |
| Avg deadhead km/trip | `{{TOKEN}}` | **the number nobody tracks** | Q5 |

> **The deadhead line is the most likely source of hidden losses.**
> HQ is Bogor. A Jakarta pickup is deadhead before the meter starts and deadhead again
> after dropoff. On a `JKT→BDG` one-way, the vehicle may drive Bogor→Jakarta (unpaid),
> Jakarta→Bandung (paid), then Bandung→Bogor (unpaid). **Unpaid km can exceed paid km on
> a one-way trip.** If `fuel_per_km` is only applied to the paid leg, every one-way corridor
> is more profitable on paper than in the bank account.
>
> **Test this first.** It is one spreadsheet and it may reprice the whole business.

---

## 10.3 `driver_hourly_loaded` — the parameter everyone gets wrong

```
❌ WRONG:  monthly_salary / 730
❌ WRONG:  monthly_salary / (22 × 8)
✅ RIGHT:  (salary + BPJS_kes + BPJS_tk + allowances + uniform + phone + idle_pay)
           ÷ (trips_per_month × avg_billable_hours_per_trip)
```

A driver is paid for the month. They are *billable* only during trips. Idle hours are a
fixed cost that must be recovered by the billable ones.

Worked structure (illustrative arithmetic on placeholders — **not a claim about Swift Rental**):

```
loaded_monthly_cost = {{TOKEN}}
trips_per_month     = {{TOKEN}}        # ← from Q7
avg_billable_hours  = {{TOKEN}}

driver_hourly_loaded = loaded_monthly_cost / (trips_per_month × avg_billable_hours)
```

**The trap:** `driver_hourly_loaded` is inversely proportional to utilization.
At 30% utilization it can be **3× higher** than the naive `/730` figure. Which means:

> **A pricing engine calibrated at high utilization will silently underprice every trip
> during a low-utilization month — exactly when margin matters most.**

Handle it by pricing off a **target** utilization, not the current one, and treating the
gap as a known, monitored fixed-cost drag. Do not let the number float month to month.

`overtime_per_hour` (currently `[ASUMSI] Rp 50.000` in `09_Pricing_Engine.md`) must be
sanity-checked against `driver_hourly_loaded`. **If overtime bills less than the loaded
driver cost, every long trip loses money at the margin** — and long trips are exactly
what the multi-stop model in the brief generates.

---

## 10.4 Layer 2 — per-vehicle monthly P&L

```
revenue_v      = Σ contribution over trips in month
fixed_v        = depreciation_monthly + insurance + tax_annual/12 + KIR/12
                 + parking + financing_interest + allocated_driver_idle
profit_v       = revenue_v − fixed_v

utilization_v  = billable_days / available_days
breakeven_trips_v = fixed_v / avg_contribution_per_trip
```

### The report that matters more than any dashboard

```sql
SELECT v.code, v.model,
       count(b.id)                    AS trips,
       sum(q.total_idr)               AS revenue,
       sum(q.cost_floor_idr)          AS variable_cost,
       sum(q.total_idr - q.cost_floor_idr) AS contribution,
       round(avg(q.margin_pct), 1)    AS avg_margin_pct
FROM bookings b
JOIN assignments a ON a.booking_id = b.id
JOIN vehicles v    ON v.id = a.vehicle_id
JOIN quotes q      ON q.id = b.quote_id
WHERE b.status = 'COMPLETED'
  AND b.scheduled_start >= date_trunc('month', now())
GROUP BY 1, 2
ORDER BY contribution ASC;   -- worst first. That's the point.
```

**Expected finding (`[ASUMSI]`, high confidence, industry-typical):**
a 14-vehicle mixed fleet is almost never uniformly profitable. Some units — usually the
premium ones bought for prestige or an anticipated segment that never materialised — carry
high fixed cost against low utilization and are subsidised by the workhorses (Avanza, Xpander).

**Implication that should be uncomfortable:** if 2–3 vehicles are structurally
unprofitable, **selling them returns more cash, faster, than any software project in
this document set.** ARSO's honest first deliverable might be a recommendation to shrink
the fleet. A consultant who cannot say that is not doing the job.

---

## 10.5 Layer 3 — the ARSO payback threshold ⚠

**This is the section that decides whether Phase 1 and Phase 2 get built at all.**

```
annual_benefit = labour_saved + leakage_recovered + loss_avoided + revenue_gained
payback_years  = build_cost / annual_benefit
```

### Ceiling analysis — where the value can *possibly* come from

**A. Labour saved — hard ceiling, and it is low**

```
labour_saved ≤ admin_headcount × fully_loaded_monthly_cost × 12 × automatable_fraction
```

You cannot save more than you currently spend. At 14 vehicles, admin is `{{TOKEN}}`
people (Q7) — realistically 1–2. Even at 100% automation (impossible; someone still
verifies payments, calls drivers, and handles the customer who wants to change the date),
the ceiling is **two salaries**.

> **Structural conclusion, independent of the missing numbers:** a build costing
> Rp 300jt+ **cannot** be justified by labour savings against a 1–2 person admin team.
> Payback exceeds 2.5 years before any discount rate, and the software needs maintenance
> the whole time. **If the pitch rests on "it saves admin time," the pitch is wrong.**

**B. Pricing leakage recovered — plausibly the largest line**

```
leakage_recovered = trips_per_year × avg_ticket × leakage_pct
```
`leakage_pct` = share of revenue lost to inconsistent manual quoting: forgotten surcharges,
forgotten overtime, negotiated-away margin, deadhead never billed.

**Measure it before claiming it.** Method: take 30 completed trips, recompute what
`09_Pricing_Engine.md` §9.3 *would* have charged, compare to what was actually invoiced.
The delta is `leakage_pct`. **This is a 2-day study and it is the single highest-value
piece of work available right now.** It costs almost nothing and it either justifies the
whole programme or kills it.

**C. Losses avoided**
```
loss_avoided = double_bookings/yr × cost_per_incident
             + lost_deals/yr × avg_contribution
             + pdp_incident_probability × expected_cost      # non-zero; see 00 §0.5
```

**D. Revenue gained — the only line big enough**
```
revenue_gained = leads/yr × Δconversion × avg_contribution
```
Faster, consistent quotes → higher close rate. But `Δconversion` is a **hypothesis**, and
it is testable in Phase 0 for near-zero marginal cost: ship the estimator, measure
`whatsapp_click → booking` before and after.

> **Phase 0 is not just a website. It is the experiment that prices Phase 1.**
> This is the strongest strategic argument in the entire document set, and it is free.

### The gate, stated plainly

```
Build Phase 1 only if:   payback_years < 2   AND   Gate 0→1 in 00_README §0.3 is cleared.

And since  labour_saved  is capped near two salaries:

  ARSO is justified by REVENUE (B + D), or it is not justified at all.

  Therefore: build the PRICING ENGINE (which captures B and D).
             Defer the ERP (which captures A).
```

**This is the same conclusion the scope analysis reached from a different direction.**
Two independent arguments converging is the closest thing to proof available here.

---

## 10.6 The scaling finding — ARSO's value is a function of fleet size

Coordination cost grows super-linearly with fleet; a spreadsheet's capacity does not.

| Fleet | Coordination load | Right tool |
|---|---|---|
| < 20 | 1 admin holds it in their head | **WhatsApp + estimator + shared calendar** |
| 20–40 | Head-holding fails; conflicts start | Booking + admin console (Phase 1) |
| 40+ | Dispatch is a full-time job | Full ARSO (Phase 2) |

**Swift Rental is at 14.**

The honest sequencing:

```
Grow the fleet → outgrow the tools → build the tools

NOT:  build the tools → hope the fleet grows into them
```

Building a 40-vehicle ERP for a 14-vehicle fleet means paying maintenance on unused
capability for years, while the money that could have bought vehicles 15–20 — which
generate revenue on day one, at a **known** return — sits in a software project with an
unknown one.

**The Rp 300jt question, framed as an operator rather than a builder:**

> Rp 300jt on ARSO, or Rp 300jt as down payment on additional vehicles?

Vehicles have a knowable ROI (contribution/month × utilization). Software's ROI is
`{{TOKEN}}` until §10.5(B) is measured. **At 14 vehicles with utilization unmeasured,
the vehicles are the better bet** — unless the leakage study says otherwise. Which is
exactly why the leakage study comes first, and why it is 2 days rather than 9 months.

---

## 10.7 Layer 4 — the agency project P&L (for the pitch itself)

Separate model. Do not mix with Swift Rental's economics — conflating "is this good for the
client" with "is this good for me" is how agencies ship things that fail.

### Phase 0 — Website + Estimator @ Rp 30jt

| Line | Value |
|---|---|
| Revenue | Rp 30.000.000 |
| Design (`{{TOKEN}}` days × rate) | `{{TOKEN}}` |
| Frontend build | `{{TOKEN}}` |
| Pricing engine + calibration (≈ 5 d) | `{{TOKEN}}` |
| Content, SEO architecture, QA | `{{TOKEN}}` |
| Hosting yr 1 (Vercel/Netlify free–hobby) | ~Rp 0 |
| **Gross margin** | `{{TOKEN}}` |

Risk lines that eat the margin:
- **Scope creep.** Contract must name the phases and price Phase 1 separately. `00_README` §0.1 is the exhibit.
- **Client-supplied data delay.** Q1–Q7 unresolved → estimator can't calibrate → the project stalls on someone else's homework. **Make Q5 + Q7 a contractual prerequisite with a defined start date.**
- **"Just add booking."** The most expensive sentence in this engagement. It is Phase 1, it is a new contract, and the answer is in `00_README` §0.3.

### Phase 1 — indicative only, do not quote

| Component | Range |
|---|---|
| Booking + payment + admin console | Rp 120–200jt |
| Rough duration | 3–4 months |

### Phase 2 — indicative only, do not quote

| Component | Range |
|---|---|
| Dispatch + fleet + driver + analytics | Rp 150–250jt |
| Rough duration | 3–5 months |

> These are order-of-magnitude figures from comparable builds, **not estimates**.
> Never put them in a client-facing document without a scoping engagement behind them.
> A number in a proposal becomes a ceiling the moment it is read.

### Recurring — where the real agency business is

| Line | Range | Note |
|---|---|---|
| Maintenance retainer | 15–20% of build/yr | Non-negotiable. Software without maintenance is a liability you gifted the client. |
| SEO/content retainer | `{{TOKEN}}` /mo | The actual ranking work. Explicitly out of Phase 0 scope. |
| Pricing-rule ops | `{{TOKEN}}` /mo | Rule updates, calibration reviews, margin reporting |

---

## 10.8 Model risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Q2 (ownership) unresolved** | Model is unbuildable, not just inaccurate. PARTNER-owned ⇒ revenue share replaces depreciation and the entire P&L inverts. | Block. Do not proceed without it. |
| Deadhead undercounted | Every corridor overstates margin | §10.2 test — one spreadsheet |
| `driver_hourly_loaded` naive | Long trips silently unprofitable | §10.3 |
| Utilization unmeasured | Fixed-cost allocation arbitrary ⇒ per-vehicle P&L is noise | Q7 |
| B2B credit terms | `payment_terms_days > 0` ⇒ working-capital gap. A 14-vehicle operator can be profitable and still go insolvent waiting on a corporate AP department. | Cash-flow model before pursuing B2B. Credit limits in `07_Database_Spec.md` §7.7. |
| PPN / PKP status (Q3) | 11% swing on every B2B line | Q3 |
| Fleet concentration | 14 assets; one write-off is 7% of capacity | Insurance adequacy review |

---

## 10.9 Immediate actions — ranked by value-per-day

| # | Action | Effort | Why it's #1..#n |
|---|---|---|---|
| 1 | **Leakage study** (§10.5-B): 30 trips, engine price vs. invoiced price | **2 days** | Decides the entire Rp 300jt question. Highest value-per-day available. |
| 2 | **Deadhead audit** (§10.2) | 1 day | May reprice the business |
| 3 | **Per-vehicle contribution** (§10.4) | 2 days | May sell 2 cars — instant cash, no build |
| 4 | Resolve Q1–Q7 | 1 week (client) | Unblocks everything downstream |
| 5 | Ship Phase 0 estimator | 4–6 weeks | Solves problems #1 + #3 *and* runs the Δconversion experiment |
| 6 | Re-evaluate Phase 1 against Gate 0→1 | — | With data instead of ambition |

> Items 1–3 cost **five days** and no code. They are worth more than the next six months
> of engineering, and they are the only work in this entire document set that can
> confidently be started tomorrow.

---

*End 10.*
