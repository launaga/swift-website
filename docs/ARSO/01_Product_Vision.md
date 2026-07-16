# 01 — PRODUCT VISION

**Phase:** All
**Precedence:** subordinate to `00_README_Index.md`

---

## 1.1 The problem, in the customer's words

> *"Gua WA jam 9 pagi nanya Jakarta–Bandung. Jam 11 belum dibales. Gua udah booking
> di tempat lain."*

> *"Bulan lalu 850. Sekarang katanya 1 juta. Rutenya sama. Kenapa?"*

Two sentences. Two problems. Both are **pricing knowledge trapped in one person's head**.

Everything else on the stakeholder problem list — double bookings, no dashboard, hard to
scale, no analytics — is a **consequence of scale the business does not yet have**, or a
symptom of the same root cause.

---

## 1.2 Problem inventory — sorted by whether it is real *today*

| # | Stated problem | Real at 14 vehicles? | Root cause | Phase |
|---|---|---|---|---|
| 1 | Slow quotation | ✅ **Yes** | Manual price derivation | **0** |
| 3 | Pricing inconsistency | ✅ **Yes** | Same. Undocumented rules. | **0** |
| 2 | WhatsApp dependency | ⚠️ **Mis-framed** | See §1.3 | — |
| 4 | Double bookings | ❓ Unmeasured | Shared calendar discipline | 1 |
| 5 | No central dashboard | ❓ Unmeasured | 14 vehicles fits in one head | 1 |
| 6 | Hard to scale | ⚠️ Anticipatory | Not a problem until you scale | 2 |
| 7 | No reporting/analytics | ⚠️ Partly | Solvable by a spreadsheet today | 1 |

> **#1 and #3 are the same problem.** Solve pricing and both fall.
> That is why `09_Pricing_Engine.md` is the core artifact and everything else is
> bookkeeping arranged around it.

---

## 1.3 The WhatsApp misdiagnosis ⚠

The stakeholder brief lists "heavy dependency on WhatsApp" as a problem to be solved by
migrating customers to an in-app booking engine.

**WhatsApp is not the problem. It is the moat.**

| Reality | Consequence |
|---|---|
| WhatsApp penetration in Indonesia is near-universal | Zero install friction, zero learning curve |
| Booking a car with a stranger for Rp 850k+ is a **trust transaction** | People want to talk to a human. A form does not reassure. |
| Arasya's positioning is trust (its live site runs a fraud-warning block) | Removing the human contradicts the positioning |
| The operator can upsell, qualify, and rescue a wobbling deal in a chat | A booking form cannot |
| A Rp 850k transaction is high-consideration | Not an impulse buy. Friction is not the binding constraint. |

**What is actually broken is not the channel. It is the *latency and inconsistency* inside
the channel.**

**Therefore:** do not replace WhatsApp. **Instrument it.**

```
❌ Website → booking form → payment → confirmation      (fights the customer's habit)
✅ Website → estimator → structured WA prefill → human  (removes latency, keeps trust)
```

A structured pre-fill turns a 12-message interrogation into a one-message confirmation.
That is the latency fix, and it costs 5% of a booking engine.

> A booking engine that customers refuse to use is worse than the WhatsApp flow it
> replaced — you now maintain both. Phase 1 exists for the day WhatsApp genuinely
> saturates (Gate 0→1), not before.

---

## 1.4 Vision statement

> **Arasya becomes the operator that answers fastest and prices the same way every time —
> and the trust that earns compounds into a defensible position in its corridor.**

Not a "mobility platform." Not a Traveloka competitor. There are 14 vehicles.
Defensibility is **trust, driver quality, reliability, and owning local search** —
which is exactly what `ARASYA_REDESIGN_PROTOTYPE_PRD.md` §1 already established.

---

## 1.5 Outcomes (not features)

| Outcome | Metric | Baseline | Target | Phase |
|---|---|---|---|---|
| Quote latency collapses | p50 first-quote time | `{{TOKEN}}` | < 5 min | 0 |
| Price becomes consistent | σ of price for identical inputs | `{{TOKEN}}` | 0 | 0 |
| Margin becomes visible | % of trips with known contribution | ~0% | 100% | 0 |
| More inquiries convert | `whatsapp_click → booking` | `{{TOKEN}}` | +`{{TOKEN}}`% | 0 |
| Organic growth | Organic sessions | `{{TOKEN}}` | +200% | 0 |
| Ops absorbs volume | Bookings per admin FTE | `{{TOKEN}}` | 2× | 1 |
| Fleet earns its keep | Fleet utilization | `{{TOKEN}}` | `{{TOKEN}}` | 2 |

> **Every baseline is `{{TOKEN}}` (Q7).** A target without a baseline is a wish.
> "+200% organic growth" is currently unfalsifiable — it cannot be proven achieved
> *or* missed, which makes it useless as a contract term and dangerous as a promise.
> **Establish baselines in week 1 or renegotiate the KPI.**

---

## 1.6 Non-goals — explicit

| Not building | Why |
|---|---|
| **Any AI feature** | No measured pain. No data volume. Cut in `ARASYA_REDESIGN_PROTOTYPE_PRD.md` §2 and it stays cut. |
| Marketplace / third-party fleet | Different business, different economics, different legal entity |
| Consumer mobile app | Users already have WhatsApp. An app is a second thing to maintain and nobody will install it. |
| Real-time GPS tracking | Customers ask for the driver's phone number, and that already works |
| Dynamic/surge pricing | 14 vehicles is not a market. It would be noise, and it would break trust. |
| Self-drive (lepas kunci) | **BLOCKED Q1** — different insurance, deposit, damage liability, and risk model. Do not scope it until confirmed. |
| International routes (SG/MY/TH) | Marketing claim, not an operational commitment. Do not build a page or a price for it. |

---

## 1.7 The four risks (per SVPG framing) — status

| Risk | Question | Status |
|---|---|---|
| **Value** | Will customers use a website estimator instead of just chatting? | ⚠️ **Partially de-risked.** Behaviour says they will WA anyway. Mitigation: the estimator's job is not to *replace* the chat but to *pre-structure* it. Value accrues even if 100% of users still click through to WA. |
| **Usability** | Can a customer pick a zone without knowing what a "zone" is? | ❌ **Not de-risked.** Highest UX risk in the build. `ZONE_OTHER` fallback + city-grouped dropdown + 5-user test before launch. See `11_UIUX_Brief.md` §4. |
| **Feasibility** | Can this be built for Rp 30jt? | ✅ **De-risked.** Static site + JSON + pure function. No backend. |
| **Business viability** | Does ARSO pay back? | ❌ **NOT de-risked. This is the big one.** See `10_Financial_Model.md` §10.5. Phase 0 is affordable regardless; **Phase 1 must not be contracted until the leakage study runs.** |

> A PRD written before discovery is a guess in a suit. The Value and Usability risks above
> are cheap to retire (a 2-day study, a 5-user test). The Viability risk is expensive to
> retire *by building* and cheap to retire *by measuring*. Measure.

---

## 1.8 Success in one sentence per phase

- **Phase 0:** A customer gets a defensible price in 30 seconds, and Arasya knows the margin on it.
- **Phase 1:** The admin stops re-typing what the customer already told the website.
- **Phase 2:** The owner answers "which vehicle should I sell?" in one click.

---

*End 01.*
