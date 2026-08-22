# 03 — PRODUCT REQUIREMENTS DOCUMENT

**Phase:** All (each requirement tagged)
**Precedence:** subordinate to `00`, `02`, `09`.

> **The Golden Rule.** This document specifies **what** and **why**. It does not dictate
> **how**. Where it names a mechanism (e.g. Postgres exclusion constraints), that is because
> the mechanism *is* the requirement — a correctness guarantee, not an implementation preference.

---

## 3.1 Requirement ID scheme

```
FR-<area>-<n>   functional         NFR-<char>-<n>   non-functional
EC-<area>-<n>   edge case          US-<role>-<n>    user story
```
Areas: `PRC` pricing · `WEB` public site · `BKG` booking · `PAY` payment ·
`DSP` dispatch · `FLT` fleet · `DRV` driver · `RPT` reporting · `SEC` security · `PDP` privacy

**Traceability rule:** every FR maps to an outcome in `01_Product_Vision.md` §1.5.
**Unmapped requirement → deleted.** This is the primary defence against scope creep, and it
is the reason the ARSO brief's feature list is not reproduced here wholesale.

---

## 3.2 Functional requirements — Phase 0

### Pricing

| ID | Requirement | Outcome | Priority |
|---|---|---|---|
| FR-PRC-001 | Compute an estimate per `09` §9.3 from (corridor, class, trip_type, tier, pickup_zone, dropoff_zone, stops[], date) | Quote latency | **P0** |
| FR-PRC-002 | Engine is a pure function; clock, rules, and locale injected | Testability | **P0** |
| FR-PRC-003 | Derive `billable_hours` from stops via `stop_type_dwell`. **Stops are never a price line.** | Pricing consistency | **P0** |
| FR-PRC-004 | `date_multiplier = max(applicable)` | Trust | **P0** |
| FR-PRC-005 | `round_up(subtotal × multiplier, 10_000)` | Trust | **P0** |
| FR-PRC-006 | Any `quote_only` input → suppress number, show contact CTA, keep WA link | Trust | **P0** |
| FR-PRC-007 | Emit a line-item breakdown with every estimate | Trust | **P0** |
| FR-PRC-008 | Rules loaded from versioned JSON; no hardcoded prices in application code | Maintainability | **P0** |
| FR-PRC-009 | Compute `cost_floor` and warn (build-time) if any configured price is below it, unless `loss_leader` | Margin visibility | P1 |

### Public site
| ID | Requirement | Outcome | Priority |
|---|---|---|---|
| FR-WEB-001 | Estimator: pickup zone, dropoff zone, class, date, trip type, stops | Conversion | **P0** |
| FR-WEB-002 | Zone inputs are **grouped dropdowns**, never free text | Pricing consistency | **P0** |
| FR-WEB-003 | Every zone input offers `ZONE_OTHER` → "Area lain — estimasi via admin" | Conversion | **P0** |
| FR-WEB-004 | Stops entered by **type**, never by duration | Pricing consistency | **P0** |
| FR-WEB-005 | Every CTA opens WhatsApp with the `09` §9.10 pre-fill incl. `ref` | Quote latency | **P0** |
| FR-WEB-006 | Site-wide verified-channel + anti-impersonation block (BR-018) | Trust | **P0** |
| FR-WEB-007 | Fleet: all 14 vehicles, filterable, pax-incl-driver noted (BR-004) | Conversion | **P0** |
| FR-WEB-008 | Tier toggle: Dalam Kota 12-jam ↔ All-in, exclusions inline (BR-007) | Trust | **P0** |
| FR-WEB-009 | Route pages per `SWIFT_REDESIGN_PROTOTYPE_PRD.md` §7.2, finite count (BR-009) | Organic growth | P1 |
| FR-WEB-010 | Cancellation policy verbatim before any payment instruction (BR-014) | Trust | **P0** |
| FR-WEB-011 | GA4 events per `SWIFT_REDESIGN_PROTOTYPE_PRD.md` §9.3, zero PII | Measurement | **P0** |
| FR-WEB-012 | Mobile-first, 380px primary | Conversion | **P0** |

> **The complete public-site spec lives in `SWIFT_REDESIGN_PROTOTYPE_PRD.md` and is not
> duplicated here.** `04_Website_Brief.md` is a pointer, deliberately.

---

## 3.3 Functional requirements — Phase 1 (GATED)

> **None of this is contracted until Gate 0→1 (`00` §0.3) clears.**

| ID | Requirement | Priority |
|---|---|---|
| FR-BKG-001 | Convert an estimate into a persisted, immutable Quote with a frozen rule version | P0 |
| FR-BKG-002 | Quote → Booking with status lifecycle (`07` §7.6) | P0 |
| FR-BKG-003 | **Prevent double-booking at the database layer.** Application-level checks are insufficient — they race. | **P0** |
| FR-BKG-004 | Enforce cancellation fees per the BR-016 decision table | P0 |
| FR-BKG-005 | Admin override of any quote, with mandatory reason code, logged | P0 |
| FR-BKG-006 | Flag any corridor overridden > 20% of the time as a rule defect | P1 |
| FR-PAY-001 | Generate invoice with gapless sequential numbering | P0 |
| FR-PAY-002 | Record DP (20%) and settlement separately | P0 |
| FR-PAY-003 | PSP webhook handling — **idempotent** (`07` §7.7 `CONSTRAINT idem`) | **P0** |
| FR-PAY-004 | Manual bank-transfer verification with an audit trail | P0 |
| FR-PAY-005 | Payment proof stored in the **specific-personal-data** tier (BR-026) | **P0** |
| FR-PDP-001 | Per-purpose consent capture | P0 |
| FR-PDP-002 | Data subject requests: access, rectify, erase, port — with SLA tracking | P0 |
| FR-PDP-003 | Erasure = anonymisation; financial records survive (`07` §7.9) | P0 |
| FR-PDP-004 | Nightly automated purge of expired ID documents; failure pages someone | P0 |

## 3.4 Functional requirements — Phase 2 (GATED)

| ID | Requirement |
|---|---|
| FR-DSP-001 | Manual vehicle + driver assignment with live conflict detection |
| FR-DSP-002 | Availability calendar with buffers visible |
| FR-FLT-001 | Document expiry reminders (STNK, KIR, insurance, permit) |
| FR-FLT-002 | Per-vehicle contribution report (`10` §10.4) |
| FR-DRV-001 | Driver rest-hour constraint — **safety, not scheduling** |
| FR-RPT-001 | Margin-by-corridor report (`SELECT` on `quotes.margin_pct` — already free from `07` §7.5) |

---

## 3.5 Non-functional requirements

> **Rule: every NFR is measurable, testable, and owned.** "Fast" and "secure" are not
> requirements; they are adjectives.
>
> **Counter-rule: over-specifying an NFR is as expensive as omitting one.** 99.9% → 99.99%
> uptime can multiply infrastructure cost 5–10×. These NFRs are sized for a **12-month
> horizon at current volume**, not for an imagined future.

### Performance

| ID | Requirement | Test | Owner |
|---|---|---|---|
| NFR-PERF-001 | Estimator LCP < 2.5s on 4G, mid-range Android, 380px | Lighthouse CI, every PR | FE |
| NFR-PERF-002 | Estimate computes in < 50ms (pure function, client-side) | Unit benchmark | FE |
| NFR-PERF-003 | CLS < 0.1, INP < 200ms | Lighthouse CI | FE |
| NFR-PERF-004 | *(P1)* API p95 < 500ms at **50 concurrent users** | k6, nightly | BE |

> **NFR-PERF-004 says 50 concurrent users, not 1.000.** At ~280 bookings/month, 1.000
> concurrent is a fantasy that would justify infrastructure nobody needs. Sizing an NFR to
> flatter the architecture is how budgets die.

### Availability

| ID | Requirement | Test |
|---|---|---|
| NFR-AVL-001 | Public site uptime ≥ 99.9%/month (static CDN — effectively free) | Uptime monitor |
| NFR-AVL-002 | *(P1)* Admin console ≥ 99.5% business hours (07:00–22:00 WIB) | Uptime monitor |
| NFR-AVL-003 | **Estimator degrades gracefully: if rules fail to load, hide the number and show the WA CTA. Never show a wrong price.** | Chaos test |

> **NFR-AVL-002 is 99.5%, not 99.9%.** The admin console going down for two hours at 3am
> costs nothing. Paying for four nines on an internal tool used by two people is theatre.

### Security

| ID | Requirement | Test |
|---|---|---|
| NFR-SEC-001 | TLS 1.3 in transit; AES-256 at rest | Config scan |
| NFR-SEC-002 | ID documents & payment proofs: private bucket, KMS, **never a public URL, never a signed URL without expiry** | Pen test |
| NFR-SEC-003 | Payment proofs use a **separate bucket + separate KMS key + separate RBAC tier** (BR-026) | Config review |
| NFR-SEC-004 | *(P1)* RBAC roles: `OWNER`, `ADMIN`, `FINANCE`, `DISPATCH`, `DRIVER`, `READONLY`; least privilege | Access matrix test |
| NFR-SEC-005 | Column-level restriction on `drivers.base_salary_idr` (FINANCE only) | Access test |
| NFR-SEC-006 | *(P1)* 2FA on all admin accounts | Manual |
| NFR-SEC-007 | Dependency scanning in CI; no known-critical CVEs at release | CI gate |
| NFR-SEC-008 | Secrets in a manager, never in the repo | Secret scan in CI |

### Privacy (UU PDP)

| ID | Requirement | Test |
|---|---|---|
| NFR-PDP-001 | Retention enforced automatically per `07` §7.9, not by memory | Job monitor + quarterly audit |
| NFR-PDP-002 | Erasure completes within the backup retention window; window documented in the privacy notice | Runbook test |
| NFR-PDP-003 | No PII in logs, analytics, or error traces | CHECK constraint + log scan |
| NFR-PDP-004 | Data subject request SLA tracked from receipt | `data_subject_requests.due_at` |
| NFR-PDP-005 | Privacy notice published, versioned, and consented against | Manual |

> **NFR-PDP-002 is the honest one.** Most systems claim erasure and quietly keep the name
> in a PITR snapshot forever. The requirement is not "erase everywhere instantly" — that is
> not achievable at this budget. It is: **bound the window, and say so publicly.** The
> undocumented gap is the violation, not the gap.

### Maintainability

| ID | Requirement |
|---|---|
| NFR-MNT-001 | Pricing rules editable **without a code change** (JSON in Phase 0; admin CRUD in Phase 1) |
| NFR-MNT-002 | 100% unit coverage on the pricing function; property tests for monotonicity |
| NFR-MNT-003 | Forward-only migrations; **zero manual production SQL** |
| NFR-MNT-004 | A new engineer ships a pricing rule change on day 1, using `09` alone |

### Usability

| ID | Requirement | Test |
|---|---|---|
| NFR-USE-001 | **≥ 4 of 5 first-time users complete an estimate unaided in < 90s** | Moderated test, pre-launch |
| NFR-USE-002 | Tap targets ≥ 44×44px | Automated a11y scan |
| NFR-USE-003 | WCAG 2.1 AA contrast | Automated |
| NFR-USE-004 | All user-facing copy in Bahasa Indonesia | Review |
| NFR-USE-005 | Respect `prefers-reduced-motion` | Manual |

> **NFR-USE-001 is the highest-risk requirement in this document.** The zone concept is an
> internal pricing abstraction leaking into a consumer UI. If users cannot map "where I am"
> to "which zone," the estimator fails and Phase 0's core hypothesis fails with it.
> **Test this with 5 real users before writing the fleet section.** Five users, one afternoon.

### Compliance & supportability

| ID | Requirement |
|---|---|
| NFR-CMP-001 | Financial records retained 10y, immutable |
| NFR-CMP-002 | Audit log 5y, append-only, partitioned |
| NFR-CMP-003 | Land-transport regulatory review completed before launch (BR-028) |
| NFR-SUP-001 | Runbook covers: rule publish, rollback, purge failure, PSP webhook replay |
| NFR-SUP-002 | Rule rollback in < 5 minutes without a developer |
| NFR-SUP-003 | Every alert names an owner and a first action. **An alert nobody owns will be muted within a month.** |

---

## 3.6 User stories & acceptance criteria (Given/When/Then)

### US-CUST-001 — Get a price without talking to anyone (P0)
> *As a customer, I want to see roughly what my trip costs before I message anyone, so I
> don't have to negotiate to find out if I can afford it.*

```gherkin
Given  I am on the estimator
When   I select Jakarta (Cibubur) → Bandung (Dago), Avanza, one-way, 3 meeting stops
Then   I see "Estimasi Rp 850.000"
And    I see a breakdown: base 700.000, penjemputan Cibubur 150.000, 10 jam ✓ termasuk
And    I see "Estimasi. Harga final dikonfirmasi admin via WhatsApp."
And    I see the tier's exclusions inline
And    I see a WhatsApp CTA
```

### US-CUST-002 — I'm not in a listed zone (P0)
```gherkin
Given  my pickup area is not in the dropdown
When   I select "Area lain"
Then   no price is shown
And    I see "Hubungi kami untuk estimasi area Anda"
And    the WhatsApp CTA pre-fills with everything I did select
```
> **This is the most important story in the set.** It is where the model admits its limits
> instead of guessing. A wrong price here costs more than no price.

### US-CUST-003 — Premium vehicle (P0)
```gherkin
Given  I select Alphard
Then   no number is shown anywhere
And    I see "Hubungi kami untuk harga terbaik"
And    the WhatsApp CTA pre-fills with vehicle = Alphard
```

### US-ADMIN-001 — One-message confirmation (P0)
```gherkin
Given  a customer arrives via the estimator CTA
When   I open the WhatsApp thread
Then   the first message contains route, date, vehicle, pax, stops, trip type, estimate, and ref
And    I can confirm or correct in a single reply
```
> This story **is** the solution to business problem #1. Not the booking engine.

### US-ADMIN-002 — Override with a reason (P1)
```gherkin
Given  a quote of Rp 850.000
When   I override to Rp 800.000
Then   I must select a reason code
And    the override, actor, and delta are logged immutably
And    the original quote row is unchanged; a superseding quote is issued
```

### US-DISPATCH-001 — Cannot double-book (P1)
```gherkin
Given  vehicle VH-004 is assigned 08:00–20:00 on 12 Aug
When   I assign VH-004 to an overlapping booking (incl. buffers)
Then   the database rejects it
And    I see which booking conflicts
```
```gherkin
Given  two dispatchers assign VH-004 to different bookings simultaneously
When   both transactions commit
Then   exactly one succeeds and the other receives a constraint violation
```
> The second scenario is the actual requirement. The first is what an application-level
> check gives you, and it is not enough.

### US-OWNER-001 — Which vehicle loses money (P2)
```gherkin
Given  a completed month
When   I open the fleet report
Then   I see contribution per vehicle, worst first
And    I can see which corridors drove it
```

### US-CUST-004 — Delete my data (P1)
```gherkin
Given  I request erasure
When   the request is approved
Then   my name, phone, email, KTP number, and ID images are removed within {{TOKEN}} days
And    my invoices and payment amounts remain (statutory retention)
And    I receive confirmation naming what was kept and why
```

---

## 3.7 Edge cases — pre-mortem output

> **Method.** Assume it is six months post-launch and the project has failed publicly.
> Work backwards to the failure chain. Below is the output, not the exercise.

### Pricing

| ID | Case | Behaviour |
|---|---|---|
| EC-PRC-001 | Rules JSON fails to load | Hide the number entirely. Show WA CTA. **Never a stale or default price.** |
| EC-PRC-002 | Zone exists, corridor doesn't | `quote_only` path |
| EC-PRC-003 | Stops in a city not on the corridor | Reject with a clear message; do not silently price it as if it were |
| EC-PRC-004 | 15 stops entered | Cap at `{{TOKEN}}`; beyond → `quote_only`. A 15-stop day is a charter, not a transfer. |
| EC-PRC-005 | Trip date is in the past | Block, inline |
| EC-PRC-006 | Trip date 2 years out | Allow, but flag `quote_only` — you cannot price fuel two years out |
| EC-PRC-007 | Same-day booking at 23:50 | Same-day fee + midnight fee both apply (**both additive**, per §9.3.3) |
| EC-PRC-008 | Pickup zone == dropoff zone | Not a corridor. Route to the 12-jam dalam-kota product. |
| EC-PRC-009 | Pax exceeds class capacity | Suggest a larger class. **Do not silently upsell** — show why. |
| EC-PRC-010 | Multiplier and same-day fee both apply | Multiplier on subtotal; same-day added **after**. Order matters and must be tested. |
| EC-PRC-011 | Estimate is Rp 0 or negative | **Impossible by construction.** Assert. If it fires, fail the build. |
| EC-PRC-012 | Rule published mid-session | Estimate uses whatever loaded at page load. Estimates are non-binding — this is acceptable and is exactly why the Estimate/Quote distinction exists. |
| EC-PRC-013 | Round trip where outbound and return dates have different multipliers | **Undefined today.** `{{TOKEN}}` — needs a business decision. Flagged, not guessed. |

### Booking / payment (Phase 1)

| ID | Case | Behaviour |
|---|---|---|
| EC-BKG-001 | Customer books; DP never paid | Auto-expire after `{{TOKEN}}` hours; release the vehicle hold |
| EC-BKG-002 | Two customers hold the last Avanza; both pay DP | **Hold on booking creation, not on payment.** Second gets a different unit or a refund. Needs an explicit policy — `{{TOKEN}}`. |
| EC-BKG-003 | Customer pays a wrong amount | `PARTIALLY_PAID`; do not auto-confirm |
| EC-BKG-004 | Customer pays twice | Idempotency constraint catches PSP retries. **Human duplicate transfers still need a refund path.** |
| EC-BKG-005 | PSP webhook arrives before the redirect | Webhook is the source of truth. Redirect is cosmetic. |
| EC-BKG-006 | PSP webhook never arrives | Reconciliation job. **Every PSP integration needs one — they all drop webhooks eventually.** |
| EC-BKG-007 | Customer cancels during the 10:00 boundary ambiguity | **Blocked on BR-016.** Do not code around an ambiguous policy; fix the policy. |
| EC-BKG-008 | Vehicle breaks down mid-trip | Not a software problem. `12_Operations_SOP.md` §6. Software records; humans solve. |
| EC-BKG-009 | Driver no-show | Same. Escalation path, not an algorithm. |
| EC-BKG-010 | Customer no-show | **BR-017 undefined.** `{{TOKEN}}` |
| EC-BKG-011 | Trip extends past booked hours | Overtime accrues from `actual_end`, not `scheduled_end`. Needs a driver-confirmation step or it becomes a dispute. |
| EC-BKG-012 | Customer changes date after DP | Reschedule policy `{{TOKEN}}` — currently a human judgement call. Code cannot judge. |
| EC-BKG-013 | Booking spans a timezone (Surabaya → WITA) | `TIMESTAMPTZ` everywhere. Display in the **pickup's** local time. |
| EC-BKG-014 | Booking crosses midnight into a holiday | Multiplier keys off `trip_date` = **pickup date**. Document it; it will be questioned. |

### Data / privacy

| ID | Case | Behaviour |
|---|---|---|
| EC-PDP-001 | Erasure requested while a booking is in progress | Defer until completion; log the deferral and its reason |
| EC-PDP-002 | Erasure requested; unpaid invoice outstanding | Retain under legitimate interest. **Tell the customer explicitly.** |
| EC-PDP-003 | Same person, two phone numbers | Two customer rows. Merge is a manual, audited operation. |
| EC-PDP-004 | Corporate PIC leaves; personal data is company-linked | Consent was personal, not corporate. Purge on request. |
| EC-PDP-005 | S3 lifecycle rule silently stops firing | **This will happen.** Quarterly verification job; alert on unexpected object count. |
| EC-PDP-006 | Customer sends KTP to WhatsApp anyway, ignoring the upload flow | **The most likely case, and the hardest.** SOP: admin saves to the system, deletes from the device. Process, not code. |

### Operational

| ID | Case | Behaviour |
|---|---|---|
| EC-OPS-001 | Someone edits a price without a reason | `NOT NULL` rejects it. No exceptions, no "quick fix" path. |
| EC-OPS-002 | Prices published with a typo (5.000.000 instead of 500.000) | Rollback in < 5 min (NFR-SUP-002) + a build-time floor/ceiling sanity check |
| EC-OPS-003 | Sole admin is unreachable | **The real single point of failure in this business.** No software fixes it. Escalation roster: `12_Operations_SOP.md` §7. |
| EC-OPS-004 | Fleet drops to 12 vehicles (2 in maintenance) during peak | Supply gate (BR-011). Availability must reflect maintenance status. |

---

## 3.8 Release criteria — definition of done

| Dimension | Gate |
|---|---|
| Functionality | All P0 FRs pass acceptance criteria |
| Pricing correctness | `09` §9.7 calibration protocol passed |
| Usability | NFR-USE-001 met with 5 real users |
| Performance | Lighthouse CI green on the 380px profile |
| Reliability | EC-PRC-001 chaos test passes (rules unavailable → no wrong price) |
| Security | No critical CVEs; secret scan clean |
| Privacy | Privacy notice published; consent captured; retention job proven |
| Supportability | Runbook exists; rule rollback demonstrated by a non-developer |
| Data integrity | Zero `{{TOKEN}}` reachable in a production path |
| Analytics | Every event fires with correct params, zero PII |

---

## 3.9 Requirements explicitly rejected from the ARSO brief

| Requested | Verdict |
|---|---|
| Dynamic pricing engine w/ real-time surge | ❌ 14 vehicles is not a market |
| Customer mobile app | ❌ WhatsApp exists and has 100% install base |
| Automatic dispatch | ❌ Phase 2 at earliest; a human beats an algorithm at this fleet size |
| Kubernetes | ❌ ~280 bookings/month. One container. `10` §10.6. |
| Redis cluster | ❌ The dataset fits in RAM on the cheapest instance available |
| Metabase | ❌ Phase 2. Until then, `SELECT` on `quotes.margin_pct`. |
| Google Maps Distance Matrix | ❌ Zone model is deterministic, free, and offline-testable (`09` §9.11) |
| AI anything | ❌ `00` §0.6 |
| OJK/BI compliance layer | ❌ Not a bank. `00` §0.5. |
| Microservices | ❌ A modular monolith for a two-person ops team |

> **Rejection is a design activity.** Each line above is budget returned to the pricing
> engine, which is the only component with a measurable return.

---

*End 03.*
