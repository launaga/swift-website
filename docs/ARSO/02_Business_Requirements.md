# 02 — BUSINESS REQUIREMENTS

**Phase:** All
**Precedence:** overrides `03_PRD.md` and below. Subordinate to `00_README_Index.md`.
**Source of truth for facts:** live site (swiftrental.com) + `SWIFT_REDESIGN_PROTOTYPE_PRD.md` Appendix A.

---

## 2.1 Legal entity & canonical identity (verbatim — never alter)

| Field | Value |
|---|---|
| Legal entity | **PT Swift Rental Indonesia (Demo)** |
| Brand | Swift Rental Car Template |
| Bank | **BCA 000 000 0000 a.n. PT Swift Rental Indonesia (Demo)** |
| WhatsApp (primary) | **0800 0000 0001** |
| WhatsApp (alt) | 0800 0000 0002 · 0800 0000 0003 |
| Email | hello@swiftrental.example |
| Instagram | @swiftrental.demo |
| HQ | Jl. Contoh No. 123, Jakarta, DKI Jakarta 10110 |
| PKP status | **`{{TOKEN}}` — BLOCKED Q3** |

**BR-001** — These strings are rendered identically everywhere. No masking, no variation,
no invention. Re-confirm with client before launch.

**BR-002** — **One canonical WhatsApp number** in all CTAs, paired with the
anti-impersonation notice. The three numbers exist operationally; **the site advertises
one.** Three numbers on a page undermines the very fraud warning printed next to them.

---

## 2.2 Services offered

| Service | Offered? | Notes |
|---|---|---|
| Rental with driver | ✅ Confirmed | The core business |
| Airport transfer | ✅ Confirmed | |
| Point-to-point | ✅ Confirmed | |
| Out-of-town / antar kota | ✅ Confirmed | |
| Multi-day | ✅ Confirmed | Triggers `driver_stay` |
| Hourly / 12-jam | ✅ Confirmed | `DALAM_KOTA_12H` tier |
| Wedding / event | ✅ Confirmed | |
| Tour / wisata | ✅ Confirmed | |
| Corporate contract | ⚠️ Partial | Blocked on Q3 (PKP) for invoicing |
| Monthly rental | ❓ **Unconfirmed** | In ARSO brief, not on live site |
| **Self-drive (lepas kunci)** | ❌ **BLOCKED Q1** | See BR-003 |

**BR-003 — Self-drive is not in scope until Q1 is answered, and answering "yes" is
expensive.** Self-drive is a **different risk business**, not a variant of the current one:

| Dimension | With driver | Self-drive |
|---|---|---|
| Insurance | Commercial passenger | Different policy, higher premium, own-damage exposure |
| Deposit | None | Required — new payment flow, new refund flow |
| ID verification | Photo, low stakes | **Legally load-bearing** — you handed a stranger an asset |
| Damage liability | Driver (employee) | Customer — needs condition reports, photos, dispute process |
| Theft risk | ~0 | **Real, and it is a total loss of 7% of the fleet** |
| Pricing model | Hours | Days + km cap + fuel policy |
| Schema | Current | New tables: deposits, condition_reports, damage_claims |

A "yes" adds a phase. It is not a checkbox on the booking form.

---

## 2.3 Fleet (14 vehicles — confirmed, live site)

| # | Vehicle | Pax* | Dalam Kota 12h | All-in | Class |
|---|---|---|---|---|---|
| 1 | Toyota Avanza | 7 | Rp 500.000 | Rp 1.250.000 | ECONOMY_MPV |
| 2 | Suzuki Ertiga | 7 | Rp 500.000 | Rp 1.250.000 | ECONOMY_MPV |
| 3 | Mitsubishi Xpander | 7 | Rp 600.000 | Rp 1.350.000 | STANDARD_MPV |
| 4 | Daihatsu Terios | 7 | Rp 600.000 | Rp 1.350.000 | STANDARD_MPV |
| 5 | Toyota Rush | 7 | Rp 600.000 | Rp 1.350.000 | STANDARD_MPV |
| 6 | Toyota Innova Reborn | 7 | Rp 700.000 | Rp 1.500.000 | PREMIUM_MPV |
| 7 | Toyota Zenix | 7 | Rp 1.000.000 | Rp 1.800.000 | PREMIUM_MPV |
| 8 | Toyota Innova Venturer | 6 | Rp 1.000.000 | Rp 1.800.000 | PREMIUM_MPV |
| 9 | Toyota Fortuner | 6 | Rp 1.500.000 | Rp 2.200.000 | SUV |
| 10 | Toyota Zenix Q Hybrid Modellista | 6 | Rp 1.300.000 | *Contact* | LUXURY |
| 11 | Toyota Alphard | 6 | *Contact* | *Contact* | LUXURY |
| 12 | Toyota Hiace Commuter | 14 | Rp 1.500.000 | *Contact* | MINIBUS |
| 13 | Toyota Hiace Premio | 14 | *Contact* | *Contact* | MINIBUS |
| 14 | Isuzu Elf Long | 19 | *Contact* | *Contact* | BUS_SMALL |

\* pax **includes driver** (live-site convention). **BR-004** — this convention must be
stated on every fleet card. "7 seats" meaning 6 passengers is a complaint waiting to happen.

**BR-005** — Pricing is **by class, not by vehicle** (`09_Pricing_Engine.md` §9.8).
Same-priced vehicles share a class. The customer picks a *class*; dispatch picks the *unit*.
Note that rows 1–2 and 3–5 already share prices — the class model is how the business
already thinks, just unwritten.

**BR-006** — "Contact for Best Price" is a **first-class state**, not missing data.
Estimator suppresses the number entirely, keeps the WA CTA. Never guess a luxury price.

---

## 2.4 Pricing tiers (confirmed)

| Tier | Includes | Excludes |
|---|---|---|
| **Dalam Kota 12-jam** | Mobil + driver, 12 hours | BBM, toll, parkir, makan driver |
| **All-in** | Mobil + driver + **BBM + toll + makan driver** | Parkir |

**BR-007** — Exclusions render **inline with the price**, never in a footnote.
A hidden exclusion discovered at pickup destroys more trust than a higher headline price.

**BR-008** — Full pricing logic is governed by `09_Pricing_Engine.md`. This document does
not restate the formula; a duplicated formula is a formula that will drift.

---

## 2.5 Service area

**Domestic (14):** Bogor, Bandung, Bekasi, Cirebon, Depok, Jakarta, Jogja, Madiun,
Malang, Pekalongan, Semarang, Surabaya, Solo, Tangerang.
**International:** Singapura, Malaysia, Thailand (Bangkok).

**BR-009 — Coverage claim ≠ operational commitment.**
14 cities → 182 directed corridors × 7 classes × 2 tiers = **2.548 prices**. Nobody will
maintain that. Priced corridors are a **finite, explicitly listed subset** (6–8 at launch,
covering ~80% of real bookings per Q7). Everything else → `ZONE_OTHER` → quote-only → WA.

**BR-010 — International routes: marketing only.** No `/rute` page, no price, no estimator
path. A Bogor-based 14-vehicle fleet does not drive to Bangkok; that inquiry is a
partnership referral, and the site must not imply otherwise.

**BR-011 — Supply gate.** Do not generate demand the fleet cannot fulfil. Every "sorry,
unavailable" is a trust withdrawal against a trust-based positioning.

---

## 2.6 Booking flow (7 steps — confirmed, live site)

| Step | Action | Phase 0 | Phase 1 |
|---|---|---|---|
| 1 | Booking form via WhatsApp | ✅ **Structured pre-fill** | Web form |
| 2 | Send KTP/SIM photo via WhatsApp | ⚠️ **PDP risk — see BR-012** | Encrypted upload |
| 3 | Invoice issued | Manual | Auto |
| 4 | **Transfer DP 20%**, proof via WA | Manual | PSP + auto-verify |
| 5 | Confirmation + vehicle (merk/plat) + driver name & number | Manual | Auto notify |
| 6 | Driver contacts & arrives | Manual | — |
| 7 | Settlement on arrival (cash / transfer / QR) | Manual | — |

**BR-012 — KTP/SIM over WhatsApp is a live PDP liability today, before any code exists.**
Photos sit in an admin's phone gallery, auto-backed-up to a consumer cloud, indefinitely,
with no deletion policy. **Fix as a Phase 0 process change** (`12_Operations_SOP.md` §4).
Zero engineering cost, and it removes more real risk than the entire Phase 1 encryption layer.

**BR-013 — DP is 20%.** Confirmed. Governs `invoices.dp_required_idr`.

---

## 2.7 Cancellation policy (verbatim — confirmed)

| Timing | Fee |
|---|---|
| H-1 (day before departure) | DP 20% **non-refundable** |
| Hari-H, before driver arrives / before 10.00 | **50%** of total invoice |
| Hari-H, after driver arrives / after 10.00 | **100%** of total invoice |

**BR-014** — Render verbatim, at the point of booking, before payment.
**BR-015** — Machine-enforced in Phase 1 (`bookings.cancel_fee_idr`).

**BR-016 — Ambiguity flagged:** "before driver arrives" **and** "before 10.00" are two
different conditions joined by a slash. A 14.00 pickup cancelled at 11.00 — is the driver
en route (100%) or not yet dispatched (50%)? **Today a human resolves this. Code cannot
"use judgement."** Rewrite the policy as a decision table before Phase 1, or it becomes a
support queue.

Proposed unambiguous form (**needs client sign-off**):

| Condition | Fee |
|---|---|
| ≥ 24h before scheduled pickup | DP forfeited (20%) |
| < 24h before pickup, driver **not yet dispatched** | 50% |
| Driver dispatched (status = `ASSIGNED` + departed) OR < 2h to pickup | 100% |

**BR-017 — No-show is undefined.** Customer absent at pickup, driver waits — how long,
and then what? Currently `{{TOKEN}}`. The `NO_SHOW` status exists in the schema; the
policy behind it does not.

---

## 2.8 Trust & anti-impersonation (first-class)

**BR-018** — Site-wide component: one canonical WA number + one official account name +
explicit statement that Swift Rental transacts **only** via the listed channel and
**BCA 000 000 0000 a.n. PT Swift Rental Indonesia (Demo)**. Warn against other numbers/accounts.

**BR-019 — No invented statistics.** No trip counts, ratings, years, customer numbers, or
city counts unless client-supplied and real. **A trust section with zero numbers beats one
with impressive lies** — and a fabricated stat next to a fraud warning is self-refuting.

**BR-020 — Insurance claims must be precise or absent.** "Insured service" without stating
covering what, whom, and to what limit is a claim you may have to defend after an incident.
Omit or specify.

**BR-021** — Real reviews or none.

---

## 2.9 Customer segments

**B2C (primary — validated):** family, tourist, executive, wedding, airport.
**B2B (secondary — `{{TOKEN}}`):** corporate, travel agent, EO, hotel, government.

**BR-022 — B2B is gated on Q3 (PKP).** Corporates require a *faktur pajak*. Non-PKP → you
cannot issue one → most corporate procurement will not onboard you. Do not build corporate
invoicing before Q3 is answered.

**BR-023 — B2B credit terms are a cash-flow risk, not a feature.** Net-30 with a corporate
AP department means fronting fuel, tolls, and driver pay for 30–60 days. A 14-vehicle
operator can be **profitable and insolvent simultaneously**. Credit limits and terms are
mandatory before any B2B push (`07_Database_Spec.md` §7.7, `10_Financial_Model.md` §10.8).

**BR-024 — Government contracts** carry procurement, e-catalog, and payment-cycle
requirements far beyond this system. Out of scope. Do not list it as a segment on the site.

---

## 2.10 Regulatory constraints

Full mapping in `00_README_Index.md` §0.5. Binding summary:

**BR-025** — **UU 27/2022 (PDP) applies.** Grace ended 17 Oct 2024. Per-purpose consent,
classified retention, working erasure path. See `07_Database_Spec.md` §7.9.
**BR-026** — **Payment proof screenshots contain account numbers → *data keuangan pribadi*
→ specific personal data.** Higher protection tier than a name.
**BR-027** — **OJK / BI banking regulation does NOT apply.** Swift Rental is not a bank and holds
no float. PSP carries the licence. Do not build for it.
**BR-028** — **Land transport regulation (Permenhub / angkutan sewa khusus) is the sectoral
regime that actually binds.** Vehicle permits, driver licensing, passenger insurance.
`{{TOKEN}}` — confirm with counsel. **This is the compliance gap worth an hour, not OJK.**
**BR-029** — Consumer protection (UU 8/1999): cancellation, price transparency, refunds.

> Engineering-side risk mapping, not legal advice.

---

## 2.11 Business rules — machine-enforceable summary

| ID | Rule | Enforced |
|---|---|---|
| BR-101 | DP = 20% of invoice total | `invoices.dp_required_idr` |
| BR-102 | A vehicle cannot hold two overlapping assignments | Postgres EXCLUDE (`07` §7.6.1) |
| BR-103 | A driver cannot hold two overlapping assignments | Postgres EXCLUDE |
| BR-104 | Blocked window = trip ± prep/return buffers | `assignments.blocked_period` |
| BR-105 | A quote is immutable; corrections supersede | `RULE ... DO INSTEAD NOTHING` |
| BR-106 | Price changes never UPDATE; they supersede with a mandatory `reason` | EXCLUDE + NOT NULL |
| BR-107 | Multipliers take `max`, never `product` | `09` §9.3.3 + test |
| BR-108 | Rounding is up-only, nearest 10.000 | `09` §9.9 + test |
| BR-109 | `quote_only` inputs suppress the number entirely | `09` §9.9 |
| BR-110 | No PII in analytics params | CHECK + review |
| BR-111 | Consent is per-purpose | `consent_records` |
| BR-112 | Public price is an **Estimate**, never a binding quote | `09` §9.9 |
| BR-113 | Every pricing override requires a reason code and is logged | CHECK + `audit_log` |
| BR-114 | Free-text address is **never** a pricing input | `07` §7.6 |

---

*End 02.*
