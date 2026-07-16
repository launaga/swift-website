# ARSO — ARASYA RENTAL OPERATING SYSTEM
## 00 — Document Index, Scope Resolution & Reading Order

**Status:** Master index. Governs all `01`–`12` documents.
**Owner:** Product Strategy
**Last structural revision:** see git history

---

## 0.1 Why this index exists

The document set had two incompatible products living inside it:

| | Product A | Product B |
|---|---|---|
| Name | Arasya Website Redesign | ARSO (Rental Operating System) |
| Artifact | `ARASYA_REDESIGN_PROTOTYPE_PRD.md` | The `01`–`12` doc set |
| Scope | Marketing site + SEO + WA funnel | Booking engine, dispatch, fleet, driver, payments, analytics |
| Conversion endpoint | WhatsApp + manual BCA | In-app booking + PSP |
| Budget signal | < Rp 30.000.000 | Rp 300.000.000+ |
| Timeline | 4–6 weeks | 6–9 months |
| Team | 1 designer + 1 FE | PM + 2 BE + 2 FE + QA + DevOps |

**These are not the same engagement and must never be pitched as one.**
Selling B at A's price is the single largest commercial risk in this project.

### Resolution: one product, three phases, gated by *evidence not calendar*

```
PHASE 0  Website Redesign + Quote Estimator     ← BUILD NOW
PHASE 1  Booking + Payment + Admin Console      ← GATED
PHASE 2  Dispatch + Fleet + Driver + Analytics  ← GATED
```

The `01`–`12` documents describe the **full ARSO target state**. Each functional
requirement carries a `PHASE` tag. Nothing outside `PHASE 0` is contracted,
priced, or promised until its gate is cleared (§0.3).

---

## 0.2 Document map

| # | Document | Purpose | Phase relevance |
|---|---|---|---|
| 00 | `00_README_Index.md` | This file. Scope resolution, gates, glossary. | All |
| 01 | `01_Product_Vision.md` | Problem, outcomes, non-goals, positioning. | All |
| 02 | `02_Business_Requirements.md` | Business rules, policies, segments, constraints. | All |
| 03 | `03_PRD.md` | FR, NFR, user stories, acceptance criteria, edge cases. | All |
| 04 | `04_Website_Brief.md` | Public site scope. **Defers to `ARASYA_REDESIGN_PROTOTYPE_PRD.md`.** | 0 |
| 05 | `05_Admin_OS.md` | Internal console: quote, booking, dispatch, verification. | 1–2 |
| 06 | `06_System_Architecture.md` | Services, data flow, deployment, security. | All |
| 07 | `07_Database_Spec.md` | ERD, tables, constraints, indexes, retention. | All |
| 08 | `08_API_Spec.yaml` | OpenAPI 3.1. REST contract + webhooks + RBAC. | 0–2 |
| 09 | `09_Pricing_Engine.md` | **The core IP.** Model, formula, calibration, governance. | 0 |
| 10 | `10_Financial_Model.md` | Unit economics, fleet P&L, ARSO payback threshold. | Decision input |
| 11 | `11_UIUX_Brief.md` | Design system, flows, states, component inventory. | All |
| 12 | `12_Operations_SOP.md` | Human procedures the software must mirror. | All |

**Reading order for a new engineer:** 00 → 01 → 02 → 09 → 07 → 03 → 06 → 08.
**Reading order for a stakeholder:** 00 → 01 → 10 → 09.

### Precedence
When documents conflict:
```
00 (scope + gates)  >  02 (business rules)  >  09 (pricing)  >  03 (PRD)  >  everything else
```
`ARASYA_REDESIGN_PROTOTYPE_PRD.md` Sections 2 & 3 remain binding for all Phase 0 web work.

---

## 0.3 Phase gates (evidence, not dates)

A gate is not "the client approved it." A gate is a **measured number**.

### Gate 0 → 1 — "manual ops is the bottleneck"
Build the booking engine + payment + admin console only when **all** are true:

| Condition | Threshold | How measured | Current |
|---|---|---|---|
| Qualified inbound leads | ≥ 15–20/day sustained 30 days | `whatsapp_click` → admin log | `{{TOKEN}}` |
| Admin quote latency | p50 > 20 min during business hours | Manual sample, 2 weeks | `{{TOKEN}}` |
| Booking loss to slow response | ≥ 10% of leads cite delay | Lost-lead tagging in WA | `{{TOKEN}}` |
| Double-booking incidents | ≥ 2/month | Ops log | `{{TOKEN}}` |
| Fleet size | ≥ 25 vehicles | Asset register | 14 |

**Rationale:** below these, a human with WhatsApp + a good estimator is *faster and
cheaper* than software. See `10_Financial_Model.md` §5 for the payback math.

### Gate 1 → 2 — "coordination is the bottleneck"
| Condition | Threshold |
|---|---|
| Confirmed bookings | ≥ 300/month |
| Vehicles | ≥ 40 |
| Drivers | ≥ 40 |
| Dispatcher headcount | ≥ 2 FTE fully loaded |
| Utilization visibility gap | Owner cannot answer "which vehicle lost money last month" in < 1 day |

### Anti-gate (kill criteria)
Stop and re-plan if any of these appear:
- Phase 0 ships and `whatsapp_click → booking` conversion does **not** improve vs. baseline → the problem was never the website. Fix supply/ops/pricing first.
- Fleet utilization < 40% → you have a **demand** problem, and ARSO does not create demand.
- Contribution margin per trip is negative on any corridor → fix `09_Pricing_Engine.md` before writing any code.

---

## 0.4 Known open questions (must be closed before Phase 0 lock)

| # | Question | Blocks | Owner | Status |
|---|---|---|---|---|
| Q1 | Does Arasya offer **self-drive / lepas kunci**? Public site shows chauffeur-only pricing; ARSO prompt lists Self Drive as a rental type. | Pricing model, insurance, deposit rules, SEO targeting, DB schema | Client | **OPEN** |
| Q2 | Are the 14 vehicles **owned, financed, or brokered** from partner owners? | Entire financial model; cost floor is meaningless without this | Client | **OPEN** |
| Q3 | Is PT. Ayomi Raya **PKP** (VAT-registered)? | B2B invoicing, corporate segment, 11% PPN in pricing | Client | **OPEN** |
| Q4 | Where do surcharge numbers (Cibubur +150k, Bekasi +200k, Lembang +200k, Ciwidey +350k) come from — measured cost or intuition? | Pricing engine calibration | Client | **OPEN** |
| Q5 | What is the **real corridor km + toll + travel time** table? | Cost floor, overtime prediction | Client | **OPEN** |
| Q6 | Current KTP/SIM photo handling: where are they stored today? | UU PDP exposure (see §0.5) | Client | **OPEN** |
| Q7 | Baseline metrics: current monthly bookings, utilization, avg ticket, admin headcount. | Every claim in `10_Financial_Model.md` | Client | **OPEN** |

> **No document in this set may substitute an invented number for an open question.**
> Unknown → `{{TOKEN}}`. Assumption → tagged `[ASUMSI]`. Fact → cited to source.

---

## 0.5 Regulatory scope — corrected

A prior research input recommended aligning this system with **OJK / Bank Indonesia
digital banking regulation (POJK 21/2023, AML/CFT, CSIRT coordination)**.

**This is wrong for this product and following it would burn budget for zero value.**

| Regulation | Applies? | Why |
|---|---|---|
| **UU 27/2022 (PDP)** | ✅ **YES — primary** | Arasya collects KTP/SIM images, names, phone numbers, and payment proof screenshots. Grace period ended 17 Oct 2024. |
| UU 11/2008 jo. 19/2016 (ITE) | ✅ Yes | Electronic records, e-signature validity on invoices. |
| PP 71/2019 / PSE registration (Kominfo) | ⚠️ Likely | If ARSO becomes a public-facing electronic system operator. Confirm with counsel. |
| Consumer protection (UU 8/1999) | ✅ Yes | Cancellation policy, price transparency, refund terms. |
| **POJK 21/2023 (Digital Services by Commercial Banks)** | ❌ **NO** | Arasya is not a bank. |
| **BI payment system licensing (PJP/PIP)** | ❌ **NO** | Arasya never holds customer funds in a float. Using Midtrans/Xendit means **the PSP carries the licence**, not Arasya. Do not build for a regime you are not in. |
| AML/CFT reporting, OJK CSIRT integration | ❌ **NO** | Not a reporting entity. |
| Land transport (Permenhub / angkutan sewa khusus) | ⚠️ **Check** | *This* is the sectoral regulator that actually matters — vehicle permits, driver licensing, passenger insurance. Far more relevant than OJK. Confirm with counsel. |

**Real, concrete PDP exposure discovered:**

1. **KTP/SIM photos sent over WhatsApp** (booking flow step 2, per the live site) currently
   live in an admin's phone gallery, unencrypted, indefinitely, with no deletion policy,
   and are auto-backed-up to a consumer cloud account. This is a live liability **today**,
   before any software is built. `12_Operations_SOP.md` §4 addresses it as a Phase 0
   process fix — no code required.

2. **Payment proof screenshots contain bank account numbers.** Under UU PDP Art. 4(2),
   *data keuangan pribadi* is classified **specific personal data**, requiring a higher
   protection standard than a name or phone number. The current flow (customer sends
   transfer proof to WhatsApp) puts specific personal data into an uncontrolled channel.

3. **Retention conflicts with backups.** "Delete my data" vs. immutable DB snapshots is a
   real architectural constraint, not a checkbox. Handled in `07_Database_Spec.md` §9.

> **Disclaimer:** this is engineering-side risk mapping, not legal advice. Have Indonesian
> counsel review before launch. The point here is *scope*: the regulation that binds you is
> PDP + transport, not banking.

---

## 0.6 What "AI" means in this document set

**Nothing.** There is no AI feature in any phase of this specification.
`ARASYA_REDESIGN_PROTOTYPE_PRD.md` §2 cut it entirely, and nothing in the business case
has changed. If it returns, it must arrive with a measured pain point and a unit-economics
justification, not as a differentiator claim.

---

## 0.7 Glossary

| Term | Definition |
|---|---|
| **Corridor** | An ordered city pair with a base price, e.g. `JKT→BDG`. Direction matters. |
| **Zone** | A priced sub-area within a city, e.g. `Cibubur`, `Dago`. The atomic unit of location for pricing. |
| **Reference origin** | The zone a corridor's base price assumes. Surcharges are deviations *from this*. |
| **Driver-hours** | The single billing meter. Everything else (stops, distance, waiting) converts into this. |
| **Deadhead** | Km driven with no revenue — HQ→pickup, dropoff→HQ. The hidden cost that kills margin. |
| **Quote** | An immutable priced snapshot. Never recomputed. |
| **Estimate** | A non-binding number shown on the public site. Legally distinct from a Quote. |
| **Contribution margin** | Revenue − variable cost. Excludes vehicle depreciation and overhead. |
| **All-in** | Tier including BBM, toll, driver meals. |
| **Dalam Kota 12-jam** | Tier excluding BBM, toll, parking, driver meals. |
| **Pax** | Passenger capacity **including driver** (per live site convention). |
| **`{{TOKEN}}`** | Unknown value. Must be replaced with client data. Never invent. |
| **`[ASUMSI]`** | An explicit assumption. Must be validated before it drives a decision. |

---

*End 00. This document sets scope and precedence. Sections 0.1 and 0.3 override
conflicting instructions in any other document.*
