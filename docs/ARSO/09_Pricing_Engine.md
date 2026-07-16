# 09 — PRICING ENGINE

**Status:** Core specification. This is the most valuable artifact in the set.
**Phase:** 0 (estimator, static JSON) → 1 (server-side, versioned) → 2 (yield rules)
**Precedence:** overrides `03_PRD.md` on any pricing conflict.

---

## 9.1 The problem this solves

Arasya's stated business problems #1 (slow quotation) and #3 (pricing inconsistency)
are **the same problem**: pricing knowledge lives in one person's head, is re-derived
by hand for every inquiry, and is therefore slow *and* inconsistent.

You cannot automate a pricing rule you have not written down. Everything else in ARSO —
booking, payment, dispatch — is bookkeeping around this engine. **Build this first, and
build it right, even if you never build anything else.**

---

## 9.2 Model classification

This is **zone-graph additive pricing**, not distance-based pricing.

| Property | Value | Consequence |
|---|---|---|
| Location granularity | Discrete zones, not coordinates | No Maps API needed for pricing. Huge cost saving. |
| Distance | Implicit in corridor base | No live routing dependency |
| Composition | Additive surcharges + multiplicative date factor | Auditable by a human with a calculator |
| Determinism | Fully deterministic | Same inputs → same output, always. Testable. |
| Storage | 4 tables (~200 rows total at current scale) | Fits in a JSON file. Genuinely. |

> **Design consequence:** Phase 0 requires **no backend**. Four static JSON files +
> a pure function in the browser reproduces the entire engine. This is why the estimator
> fits a Rp 30jt scope while ARSO does not.

---

## 9.3 The formula

### 9.3.1 Canonical form

```
# ---------- STEP 1: derive the billing meter ----------
travel_hours     = corridor.travel_hours × (trip_type == ROUND_TRIP ? 2 : 1)
dwell_hours      = Σ over stops[i] of stop_type_dwell[stops[i].type]
buffer_hours     = corridor.buffer_hours
billable_hours   = ceil(travel_hours + dwell_hours + buffer_hours)

# ---------- STEP 2: base ----------
base             = corridor_price[corridor][vehicle_class][trip_type]
                   # base INCLUDES corridor.included_hours

# ---------- STEP 3: additive deviations ----------
pickup_fee       = zone[pickup].pickup_fee        # deviation from corridor.reference_origin
dropoff_fee      = zone[dropoff].dropoff_fee      # deviation from corridor.reference_destination
overtime_fee     = max(0, billable_hours − corridor.included_hours) × rules.overtime_per_hour
addons           = Σ selected add-on prices

subtotal         = base + pickup_fee + dropoff_fee + overtime_fee + addons

# ---------- STEP 4: multiplicative ----------
date_multiplier  = max( applicable multipliers )    # NOT product. See 9.3.3
total_before_tax = round_up(subtotal × date_multiplier, 10_000)

# ---------- STEP 5: tax ----------
ppn              = is_pkp ? round(total_before_tax × 0.11) : 0     # blocked on Q3
total            = total_before_tax + ppn
```

### 9.3.2 Worked example — the case from the brief

```
Input:  Jakarta → Bandung, Avanza, one-way
        pickup  = Cibubur
        dropoff = Dago
        stops   = [Dago(meeting), Stop2(meeting), Stop3(meeting)]
        date    = regular weekday
```

| Line | Source | Value |
|---|---|---|
| Base — JKT→BDG, Economy MPV, one-way (includes 12h) | `corridor_price` | Rp 700.000 |
| Pickup deviation — Cibubur | `zone.pickup_fee` | Rp 150.000 |
| Dropoff deviation — Dago | `zone.dropoff_fee` | Rp 0 |
| travel 3.5h + dwell (3 × 1.5h) + buffer 1h = **9.5h → 10h** | derived | ≤ 12h included |
| Overtime | `max(0, 10 − 12) × 50.000` | Rp 0 |
| Subtotal | | **Rp 850.000** |
| Multiplier — regular weekday | `date_rules` | ×1.00 |
| **Estimate** | | **Rp 850.000** |

Matches the client's manual quote. **This is the calibration test: the engine must
reproduce ~30 historical manual quotes within ±10% before it goes live.** Any quote it
cannot reproduce is either a missing rule or a pricing mistake the business has been
making — see §9.7.

### 9.3.3 Multipliers do NOT stack

**Rule: `date_multiplier = max(applicable)`, never `product(applicable)`.**

Why: Lebaran (×1.6) landing on a long weekend (×1.3) would compound to ×2.08. A customer
who booked the same trip a month earlier at ×1.0 sees a 108% increase and never returns.
Multiplicative stacking is how a pricing engine silently destroys a trust-based business.

Same-day booking fee is **additive**, not multiplicative — it reflects a fixed
dispatch-scramble cost, not a demand signal.

---

## 9.4 The two design decisions that matter

### 9.4.1 Driver-hours is the only meter. Stops are an *input*, not a *charge*.

The original model billed both a 12-hour tier **and** a per-extra-stop fee. These are
two proxies for the same underlying cost: **driver time**. Billing both double-counts on
some trips and undercounts on others, and nobody notices until a customer does the math.

**Resolution:**

```
stops → (via stop_type_dwell) → hours → (via overtime_per_hour) → money
```

Stops never appear as a price line. They appear as a **driver of the hours line**.

The UI still collects stops — that is the customer's mental model ("3 titik di Bandung"),
and forcing them to estimate hours is a conversion killer. The engine translates.

**Display contract (mandatory):**

```
Estimasi 10 jam kerja (3,5j perjalanan + 4,5j di 3 titik + 1j buffer)
Termasuk dalam paket 12 jam.  ✓ Tidak ada biaya lembur.
```

The customer sees the *causal chain*, not a black box. This is the trust positioning
executed at the level of a price line.

**Dwell table** (`[ASUMSI]` — calibrate against real trip logs, Q5):

| Stop type | Default dwell | Notes |
|---|---|---|
| `DROP_ONLY` | 0.25 h | Passenger exits, driver leaves |
| `PICKUP_ONLY` | 0.25 h | |
| `SHORT_WAIT` | 0.75 h | Errand, ATM, food |
| `MEETING` | 1.5 h | Client meeting — **the dominant case** |
| `MEAL` | 1.5 h | |
| `LONG_WAIT` | 3.0 h | Event, wedding, extended stay |
| `OVERNIGHT` | — | Triggers `driver_stay` add-on, not dwell |

Customer picks a *type*, never a number. Free-text duration invites negotiation and
re-introduces the inconsistency you are trying to kill.

### 9.4.2 Zone fees are *deviations from a reference*, not absolute values

A corridor's base price silently assumes an origin. `JKT→BDG @ 700k` assumes pickup
*somewhere in Jakarta*. Which Jakarta? The base is meaningless until you name the point.

```
corridor.reference_origin      = ZONE_JAKARTA_PUSAT     # base assumes this
corridor.reference_destination = ZONE_BANDUNG_KOTA

zone.pickup_fee  = cost(HQ → zone → corridor_entry) − cost(HQ → reference_origin → corridor_entry)
zone.dropoff_fee = cost(corridor_exit → zone) − cost(corridor_exit → reference_destination)
```

Without a reference origin, surcharges are unfalsifiable — you can never prove one is
wrong, which means you can never fix it.

---

## 9.5 Cost floor — the audit function

Every price must be checked against a cost floor derived from first principles.
This function is **not used to set prices**. It is used to **catch prices that are wrong**.

```
# Deadhead = km with no revenue. The margin killer nobody tracks.
deadhead_km   = dist(HQ, pickup_zone) + dist(dropoff_zone, HQ)
revenue_km    = corridor.km × (round_trip ? 2 : 1)
total_km      = deadhead_km + revenue_km

variable_cost = total_km × (fuel_per_km + tyre_per_km + service_per_km)
              + billable_hours × driver_hourly_loaded
              + (all_in_tier ? corridor.toll + driver_meal : 0)
              + (overnight_nights × driver_stay_cost)

# Depreciation is a real per-km cost even though it feels "free" until resale.
depreciation  = total_km × (acquisition_cost − residual_value) / expected_lifetime_km

cost_floor    = variable_cost + depreciation
price_floor   = cost_floor / (1 − target_contribution_margin)
```

### Parameters — ALL `{{TOKEN}}`, none invented

| Param | Value | Source | Status |
|---|---|---|---|
| `fuel_per_km` | `{{TOKEN}}` | fuel receipts ÷ odometer, per vehicle class | **BLOCKED Q5** |
| `tyre_per_km` | `{{TOKEN}}` | tyre cost ÷ rated km | **BLOCKED** |
| `service_per_km` | `{{TOKEN}}` | 12-month service spend ÷ km | **BLOCKED** |
| `driver_hourly_loaded` | `{{TOKEN}}` | (salary + BPJS + allowance) ÷ productive hours. **Not** ÷ 730. | **BLOCKED** |
| `driver_meal` | `{{TOKEN}}` | | **BLOCKED** |
| `driver_stay_cost` | `{{TOKEN}}` | per overnight | **BLOCKED** |
| `corridor.toll` | `{{TOKEN}}` | actual e-toll statements | **BLOCKED Q5** |
| `depreciation_per_km` | `{{TOKEN}}` | **BLOCKED Q2** — meaningless if vehicles are brokered, not owned | **BLOCKED** |
| `target_contribution_margin` | `{{TOKEN}}` | owner decision | **BLOCKED** |

> **`driver_hourly_loaded` is the most-often-botched parameter in this industry.**
> Dividing monthly salary by 730 hours understates it by 3–5×. A driver is only
> billable during trips. Divide by *productive* hours: `salary ÷ (trips/month × avg_hours)`.
> Get this wrong and every long-duration trip is silently unprofitable.

---

## 9.6 The Cibubur anomaly — a finding, not a bug

**Observation:** HQ is Bogor. Cibubur carries `pickup_fee = +150.000` on `JKT→BDG`.

**Hypothesis (unverified — needs Q5 data):** Bogor→Cibubur is a short deadhead, and
Cibubur sits on the JORR near the Cipularang approach. It is plausibly **cheaper to serve
than Jakarta Pusat**, which the base price assumes at +0.

If true, one of three things is happening:

1. **The reference origin is wrong.** The base doesn't actually assume Jakarta Pusat — it
   assumes something else, and nobody wrote it down. → Fix the reference, surcharges fall out.
2. **The surcharge is a demand signal, not a cost signal.** Cibubur customers pay more
   because they will. That is legitimate pricing — but call it what it is, put it in a
   `demand_uplift` field, and don't pretend it's a cost recovery.
3. **The number came from feeling.** → You are about to encode an eight-year-old gut call
   as a permanent system constant, and it will outlive everyone who could explain it.

**Do not skip this.** Automating an unexamined price list means you have industrialized
problem #3 instead of solving it. The engine's first job is to make every number in the
table *defensible*.

**Method (2 days, no code):**
1. Pull real km + toll + travel time for the top 8 corridors from actual trip records.
2. Compute `cost_floor` per corridor × vehicle class.
3. Compute implied contribution margin for every current price.
4. Sort by margin. **Anything below the target margin is a price you are losing money on today.**
5. Anything above 2× target is either premium positioning (keep, name it) or a customer you are about to lose to a competitor.

Output: a one-page margin heatmap. This alone is worth more than the website.

---

## 9.7 Calibration protocol (gate before go-live)

The engine ships only when it passes:

| Test | Threshold | Rationale |
|---|---|---|
| **Backtest** — 30 historical manual quotes, spread across corridors/classes/dates | ≥ 80% within ±10% | Proves the engine encodes real behaviour |
| **Outlier review** — each of the remaining ≤ 20% classified | 100% classified as `MISSING_RULE` / `MISPRICE_HISTORICAL` / `NEGOTIATED_EXCEPTION` | An unexplained outlier is an unwritten rule |
| **Floor test** — no configured price below `price_floor` | 0 violations, or explicit `loss_leader = true` flag | Catches structural losses |
| **Monotonicity** — price never decreases when hours, stops, distance, or class increase | 0 violations, property-tested | Catches additive-model pathologies |
| **Determinism** — same input × 1000 runs | identical output | |

> A backtest miss is **not** an engine bug by default. It is a fork:
> either the rule is missing, or the historical price was wrong. Both are findings.

---

## 9.8 Data model (Phase 0 = 4 JSON files)

### `vehicle_classes.json`
```json
[
  { "id": "ECONOMY_MPV",  "label": "Economy MPV",  "pax": 7,  "vehicles": ["Toyota Avanza", "Suzuki Ertiga"] },
  { "id": "STANDARD_MPV", "label": "Standard MPV", "pax": 7,  "vehicles": ["Mitsubishi Xpander", "Daihatsu Terios", "Toyota Rush"] },
  { "id": "PREMIUM_MPV",  "label": "Premium MPV",  "pax": 7,  "vehicles": ["Toyota Innova Reborn", "Toyota Zenix", "Toyota Innova Venturer"] },
  { "id": "SUV",          "label": "SUV",          "pax": 6,  "vehicles": ["Toyota Fortuner"] },
  { "id": "LUXURY",       "label": "Luxury",       "pax": 6,  "vehicles": ["Toyota Alphard", "Toyota Zenix Q Hybrid Modellista"], "quote_only": true },
  { "id": "MINIBUS",      "label": "Minibus",      "pax": 14, "vehicles": ["Toyota Hiace Commuter", "Toyota Hiace Premio"] },
  { "id": "BUS_SMALL",    "label": "Elf",          "pax": 19, "vehicles": ["Isuzu Elf Long"], "quote_only": true }
]
```
> **Price by class, not by vehicle.** 14 vehicles × N corridors × 2 tiers is an
> unmaintainable matrix that guarantees drift. 7 classes is maintainable.
> `quote_only: true` → estimator shows "Contact for Best Price", CTA still pre-fills WA.

### `zones.json`
```json
[
  {
    "id": "ZONE_JKT_PUSAT", "city": "JAKARTA", "label": "Jakarta Pusat",
    "pickup_fee": 0, "dropoff_fee": 0,
    "deadhead_km_from_hq": "{{TOKEN}}",
    "basis": "REFERENCE_ORIGIN"
  },
  {
    "id": "ZONE_CIBUBUR", "city": "JAKARTA_GREATER", "label": "Cibubur",
    "pickup_fee": 150000, "dropoff_fee": 0,
    "deadhead_km_from_hq": "{{TOKEN}}",
    "basis": "UNVERIFIED — see §9.6"
  },
  {
    "id": "ZONE_BEKASI", "city": "JAKARTA_GREATER", "label": "Bekasi",
    "pickup_fee": 200000, "dropoff_fee": 0,
    "deadhead_km_from_hq": "{{TOKEN}}", "basis": "UNVERIFIED"
  },
  {
    "id": "ZONE_DAGO", "city": "BANDUNG", "label": "Dago",
    "pickup_fee": 0, "dropoff_fee": 0,
    "basis": "REFERENCE_DESTINATION"
  },
  {
    "id": "ZONE_LEMBANG", "city": "BANDUNG", "label": "Lembang",
    "pickup_fee": 0, "dropoff_fee": 200000, "basis": "UNVERIFIED"
  },
  {
    "id": "ZONE_CIWIDEY", "city": "BANDUNG", "label": "Ciwidey",
    "pickup_fee": 0, "dropoff_fee": 350000, "basis": "UNVERIFIED"
  },
  {
    "id": "ZONE_OTHER", "city": "*", "label": "Area lain — estimasi via admin",
    "quote_only": true
  }
]
```

> **`ZONE_OTHER` is mandatory and non-negotiable.** Without it, a customer in an
> unlisted area picks the nearest listed zone, gets a wrong price, and you dispute it
> over WhatsApp — recreating problem #3 with extra steps and an anchoring number
> already in their head.

### `corridors.json`
```json
[
  {
    "id": "JKT_BDG", "from_city": "JAKARTA", "to_city": "BANDUNG",
    "reference_origin": "ZONE_JKT_PUSAT",
    "reference_destination": "ZONE_BANDUNG_KOTA",
    "km": "{{TOKEN}}", "toll": "{{TOKEN}}",
    "travel_hours": 3.5, "buffer_hours": 1.0, "included_hours": 12,
    "price": {
      "ECONOMY_MPV":  { "ONE_WAY": 700000, "ROUND_TRIP": "{{TOKEN}}" },
      "STANDARD_MPV": { "ONE_WAY": "{{TOKEN}}", "ROUND_TRIP": "{{TOKEN}}" },
      "PREMIUM_MPV":  { "ONE_WAY": "{{TOKEN}}", "ROUND_TRIP": "{{TOKEN}}" },
      "SUV":          { "ONE_WAY": "{{TOKEN}}", "ROUND_TRIP": "{{TOKEN}}" },
      "LUXURY":       { "ONE_WAY": null, "ROUND_TRIP": null },
      "MINIBUS":      { "ONE_WAY": "{{TOKEN}}", "ROUND_TRIP": "{{TOKEN}}" }
    }
  }
]
```
> `null` = quote-only. `{{TOKEN}}` = we don't know yet. **They are different.**
> A `{{TOKEN}}` in production is a bug; a `null` is a business decision.

**Corridor count discipline (mirrors the SEO supply gate):** build corridors the fleet
can actually serve. The 14-city list is a *marketing* claim, not a pricing commitment.
14 cities → 91 unordered pairs → 182 directed corridors × 7 classes × 2 trip types =
**2.548 prices**. Nobody will maintain that; it will rot inside a quarter.
**Start with 6–8 corridors covering ~80% of real bookings** (from booking history, Q7).
Everything else → `ZONE_OTHER` / quote-only. Coverage is a *sales* claim; corridors are
an *operational* commitment.

### `rules.json`
```json
{
  "overtime_per_hour": { "ECONOMY_MPV": 50000, "PREMIUM_MPV": "{{TOKEN}}", "_note": "[ASUMSI] — calibrate vs driver_hourly_loaded" },
  "stop_type_dwell_hours": { "DROP_ONLY": 0.25, "PICKUP_ONLY": 0.25, "SHORT_WAIT": 0.75, "MEETING": 1.5, "MEAL": 1.5, "LONG_WAIT": 3.0 },
  "addons": {
    "DRIVER_STAY":      { "price": "{{TOKEN}}", "unit": "per_night" },
    "MIDNIGHT_PICKUP":  { "price": "{{TOKEN}}", "condition": "pickup_time in [22:00, 05:00)" },
    "SAME_DAY_BOOKING": { "price": "{{TOKEN}}", "condition": "booking_date == trip_date", "type": "ADDITIVE" }
  },
  "date_multipliers": [
    { "id": "REGULAR",      "factor": 1.00 },
    { "id": "WEEKEND",      "factor": "{{TOKEN}}", "days": ["SA", "SU"] },
    { "id": "LONG_WEEKEND", "factor": "{{TOKEN}}", "dates": [] },
    { "id": "HOLIDAY_PEAK", "factor": "{{TOKEN}}", "dates": [], "_note": "Lebaran, Natal, Tahun Baru" }
  ],
  "multiplier_policy": "MAX_NOT_PRODUCT",
  "rounding": { "mode": "UP", "nearest": 10000 },
  "estimate_disclaimer_required": true
}
```

**Admin editing, Phase 0:** Google Sheet → CSV export → validation script → JSON → rebuild.
Two-minute deploy, versioned in git, zero infrastructure. **This is what
"pricing engine configurable from admin dashboard" costs at Rp 30jt.** A real admin
CRUD dashboard is Phase 1 and needs the rule-versioning schema in `07_Database_Spec.md` §4.

---

## 9.9 Estimate ≠ Quote ≠ Invoice

The single most dangerous failure mode in this build: a number on a screen becomes a
promise. Arasya's entire positioning is trust. A price that moves after the customer
saw it does more damage than never showing a price at all.

| | **Estimate** | **Quote** | **Invoice** |
|---|---|---|---|
| Where | Public site | Admin / after WA contact | After DP |
| Binding? | **No** | Yes, until `expires_at` | Yes |
| Precision | Rounded up to 10k | Exact | Exact |
| Persisted? | Ephemeral + analytics event | **Immutable row** | Immutable row |
| Rule version | Latest published | **Frozen at issue** | Frozen |
| Phase | 0 | 1 | 1 |

**Mandatory UI contract for Estimate (Phase 0):**

```
┌────────────────────────────────────────────┐
│  Estimasi Harga                            │
│                                            │
│  Rp 850.000                                │
│                                            │
│  Rincian:                                  │
│    Jakarta → Bandung (Avanza)   700.000    │
│    Penjemputan Cibubur          150.000    │
│    Estimasi 10 jam kerja            ✓ termasuk  │
│                                            │
│  ⓘ Estimasi. Harga final dikonfirmasi     │
│    admin via WhatsApp. Belum termasuk      │
│    BBM, toll, parkir, makan driver.        │
│                                            │
│  [ Lanjut ke WhatsApp ]                    │
└────────────────────────────────────────────┘
```

- Never "Total" or "Bayar Sekarang". Always "Estimasi".
- Always show the breakdown. A single number invites suspicion; a breakdown invites trust.
- Always show the tier's exclusions inline.
- If any input hits a `quote_only` path → suppress the number entirely, show
  "Hubungi kami untuk harga terbaik", keep the WA CTA. **Never show a partial or guessed price.**

**Round-up-only rule.** `round_up(x, 10_000)`. Rounding down means the operator's final
number is always higher than the screen's — the exact failure this section exists to prevent.
Rounding up means the operator can only ever go *down*, which is a discount, which closes deals.

**Operator override discipline (Phase 1):** the admin can override any quote, but the
override requires a reason code and is logged. Overrides are a **signal**, not a feature:
if a corridor is overridden > 20% of the time, the rule is wrong. Fix the rule.

---

## 9.10 WhatsApp pre-fill contract (Phase 0 conversion surface)

Every estimator CTA emits a structured message so the operator can confirm in one reply
instead of a five-message interrogation. **This — not the booking engine — is what
actually kills problem #1.**

```
Halo Arasya, saya mau booking:

Rute      : Jakarta (Cibubur) → Bandung (Dago)
Tanggal   : 12 Agustus 2026, jemput 07.00
Kendaraan : Avanza (Economy MPV)
Penumpang : 4 orang
Titik     : 3 titik di Bandung (meeting)
Tipe      : Sekali jalan
Estimasi  : Rp 850.000 (belum termasuk BBM/toll/parkir/makan driver)

(ref: JKT_BDG/ECONOMY_MPV/ONE_WAY/20260812/q-a7f3c1)
```

- `ref` is a deterministic hash of the input set. It is how a WhatsApp conversation gets
  reconciled back to an analytics event — and, in Phase 1, to a `quote` row.
- Emit `whatsapp_click` with `{corridor, vehicle_class, trip_type, estimate_idr, ref}` **before** the redirect.
- **No PII in the ref or in any analytics param.** PDP-safe by construction.

---

## 9.11 Explicitly out of scope

| Excluded | Why | Revisit when |
|---|---|---|
| Distance-based pricing (Maps Distance Matrix) | Zone model is sufficient, deterministic, free, and offline-testable. Maps adds cost, latency, quota limits, and non-determinism. | Coverage exceeds ~30 corridors |
| Real-time dynamic / surge pricing | 14 vehicles. There is no market thick enough for a demand signal. It would be noise. | Fleet > 50 and utilization > 70% |
| ML / AI price prediction | Nothing to learn from that a lookup table doesn't already encode. You do not have the data volume. | Never, realistically |
| Competitor price scraping | Legal risk + your positioning is trust, not cheapness | Never |
| Per-vehicle (not per-class) pricing | 2.548-cell matrix; guaranteed drift | Never |

---

## 9.12 Acceptance criteria (Phase 0)

- [ ] Engine is a **pure function** — no I/O, no clock, no network. Clock and rules injected.
- [ ] 100% unit coverage on the pricing function; property tests for monotonicity.
- [ ] Backtest passes §9.7 thresholds against ≥ 30 real historical quotes.
- [ ] Every `{{TOKEN}}` resolved or the affected path forced to `quote_only`.
- [ ] Zero `{{TOKEN}}` reachable in a production code path.
- [ ] `ZONE_OTHER` fallback present on every location input.
- [ ] Breakdown displayed for every estimate; word "Estimasi" present; disclaimer present.
- [ ] `quote_only` inputs suppress the number entirely.
- [ ] Multiplier policy = `MAX`, verified by test.
- [ ] Rounding is up-only, verified by test.
- [ ] WA pre-fill matches §9.10 byte-for-byte, incl. `ref`.
- [ ] `whatsapp_click` fires with full params, zero PII.
- [ ] Rule files versioned in git; every change has an author and a reason in the commit.

---

*End 09.*
