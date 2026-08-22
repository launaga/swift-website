# 04 — WEBSITE BRIEF

**Phase:** 0
**Status:** **Pointer document. Deliberately thin.**

---

## 4.1 This document does not restate the website spec

The complete public-site specification lives in:

### → `SWIFT_REDESIGN_PROTOTYPE_PRD.md`

It is build-ready and already covers: scope lock, hard constraints, design system
(black/white/blue tokens), homepage section-by-section, IA + URL structure, route-page
template, component inventory, WhatsApp funnel contract, GA4 event schema, and Phase 2
upsell hooks.

**Duplicating it here would create two specs that drift, and the day they disagree nobody
knows which one the build followed.** One source of truth, per document.

---

## 4.2 What this document *does* add — the deltas from ARSO

Three things changed since that PRD was written. Only these are recorded here.

### Delta 1 — The estimator is now a homepage section

The original PRD's homepage spec (§6) has no estimator. It should. Insert as **section 3**,
immediately after the hero, **above** the trust block:

```
1. Header / nav
2. Hero
3. ► ESTIMATOR ◄            NEW — the primary conversion surface
4. Trust / Verified Channels
5. Fleet showcase
6. Pricing (tier toggle)
7. Services
8. Popular routes
9. Why choose us
10. Gallery
11. Testimonials
12. Corporate CTA
13. Footer
```

**Rationale:** the estimator *is* the solution to business problems #1 and #3
(`01_Product_Vision.md` §1.2). Everything below it is supporting material. Burying the
one component that differentiates this site from every other rental page in Bogor —
below a fleet grid nobody scrolls to on a 380px screen — wastes the build.

**It does not replace the WhatsApp CTA. It pre-loads it.**

Full spec: `09_Pricing_Engine.md` §9.9 (UI contract) and §9.10 (pre-fill contract).
Interaction design: `11_UIUX_Brief.md` §4.

### Delta 2 — Route page count is now bounded by *corridors*, not by ambition

The original PRD §7.3 set a finite page count. `02_Business_Requirements.md` BR-009
tightens the basis: build `/rute` pages **only for priced corridors** — the 6–8 that cover
~80% of real bookings (Q7).

A route page whose estimator returns `quote_only` is an SEO page that cannot convert.
It ranks, the visitor arrives, sees no price, and leaves. **Worse than not existing** —
it burns crawl budget and produces a bounce signal on a page that was supposed to prove
authority.

**Rule: a `/rute` page exists if and only if its corridor is priced.**

### Delta 3 — International routes are removed from the site's commercial surface

The live site lists Singapura / Malaysia / Thailand. Per BR-010, these are a **marketing
claim, not an operational commitment**. A Bogor-based 14-vehicle fleet does not drive to
Bangkok.

- No `/rute` page. No price. No estimator path.
- Acceptable: a single line under service area.
- Not acceptable: anything implying you can book it.

**Supply gate (BR-011):** every inquiry that ends in "sorry, unavailable" is a trust
withdrawal — against a business whose entire positioning is trust, on a page that carries
a fraud warning. The site must not write cheques the fleet cannot cash.

---

## 4.3 Constraint reminders (already binding — repeated because they get violated)

From `SWIFT_REDESIGN_PROTOTYPE_PRD.md` §3, restated for anyone reading this file alone:

- **Exact BCA + PT name, verbatim.** BCA 000 000 0000 a.n. PT Swift Rental Indonesia (Demo).
- **One canonical WhatsApp number** on the site (BR-002). The three exist operationally;
  the site advertises one. Three numbers printed next to a fraud warning undermines the
  fraud warning.
- **No invented statistics.** Zero trust numbers beats impressive lies — and a fabricated
  stat beside an anti-fraud notice is self-refuting.
- **No hotlinked images.**
- **WhatsApp is the only conversion endpoint.**
- **Pax includes driver** — stated on every fleet card (BR-004).
- **Tier exclusions inline with the price**, never in a footnote (BR-007).
- **The word "Estimasi", never "Total"** (`09` §9.9).

---

## 4.4 Acceptance

Website acceptance is `SWIFT_REDESIGN_PROTOTYPE_PRD.md` §12, **plus**:

- [ ] Estimator renders as homepage section 3
- [ ] Estimator passes `09_Pricing_Engine.md` §9.12
- [ ] Estimator passes NFR-USE-001 (**≥ 4 of 5 first-time users complete unaided in < 90s**)
- [ ] `/rute` pages exist only for priced corridors
- [ ] No international route page exists
- [ ] Exactly one WhatsApp number appears in CTAs

> **NFR-USE-001 is the one that will fail.** "Zone" is an internal pricing abstraction
> leaking into a consumer UI. Test it with five real users before building the fleet
> section — one afternoon, and it is the difference between a working estimator and a
> beautiful one nobody completes.

---

*End 04.*
