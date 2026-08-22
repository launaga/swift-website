# 11 — UI/UX BRIEF

**Phase:** All
**Design system source of truth:** `SWIFT_REDESIGN_PROTOTYPE_PRD.md` §5.
Tokens, typography, and motion are **not** restated here — two design systems is no design system.

---

## 11.1 The one hard UX problem

> **"Zone" is an internal pricing abstraction. The customer does not know they live in one.**

The engine needs a discrete zone (`09` §9.4.2). The customer knows an address.
Bridging that gap is the entire UX risk of Phase 0. Everything else is layout.

Fail it and the estimator doesn't get completed → no pre-fill → no latency fix → Phase 0's
core hypothesis is untested → Phase 1 has no evidence → the whole programme stalls on a
dropdown.

**NFR-USE-001: ≥ 4 of 5 first-time users complete an estimate unaided in < 90s.**
Test with five real users **before** building the fleet section. One afternoon.

---

## 11.2 Zone selection — the design

### ❌ Rejected

| Pattern | Why it fails |
|---|---|
| Free-text address | Never a pricing input (BR-114). Ambiguous, unmappable, invites typos that become disputes. |
| Map pin | Implies precision the model doesn't have; needs Maps API; fails on mobile data; a pin 200m across a boundary changes the price and the customer will notice. |
| Flat alphabetical dropdown | 40 zones in one list. Cognitive load. Nobody scrolls to "Cibubur." |
| Ask "Jakarta atau bukan?" | **The trap named in the brief.** Puts the pricing model's internal question in front of the customer. Cibubur residents genuinely disagree about the answer, and the price hangs on it. |

### ✅ Adopted — two-step, grouped, with escape

```
┌──────────────────────────────────────┐
│ Dijemput di mana?                    │
│                                      │
│  ┌────────────┐  ┌────────────┐      │
│  │  Jakarta   │  │   Bogor    │      │  ← step 1: city (big targets)
│  └────────────┘  └────────────┘      │
│  ┌────────────┐  ┌────────────┐      │
│  │   Depok    │  │  Tangerang │      │
│  └────────────┘  └────────────┘      │
│  ┌────────────────────────────┐      │
│  │  Area lain…                │      │  ← always present
│  └────────────────────────────┘      │
└──────────────────────────────────────┘
          ↓ Jakarta selected
┌──────────────────────────────────────┐
│ Area mana di Jakarta?                │
│                                      │
│  ○ Jakarta Pusat            +0       │  ← step 2: zone, WITH the fee visible
│  ○ Jakarta Selatan          +0       │
│  ○ Jakarta Timur            +0       │
│  ○ Cibubur               +150.000    │
│  ○ Bekasi                +200.000    │
│  ○ Tidak yakin / area lain           │
│                                      │
│  ⓘ Biaya penjemputan mengikuti       │
│    jarak dari pool kami.             │
└──────────────────────────────────────┘
```

**Design decisions, each load-bearing:**

1. **Fees are visible at selection time.** Hiding them until the total appears makes the
   number feel like a trick. Showing them makes it feel like a menu. Same money, opposite
   emotion.
2. **`Area lain` on every level** (FR-WEB-003, US-CUST-002). Non-negotiable. Without it a
   customer picks the nearest wrong zone, gets a wrong price, and disputes it on WhatsApp
   — recreating problem #3 with an anchoring number already in their head.
3. **`Tidak yakin` is separate from `Area lain`.** "I don't know which zone" and "my area
   isn't listed" are different states. Both → `quote_only`, but the copy differs and so
   does what the admin needs to ask.
4. **Geolocation is a hint, never an answer.** Optional "Deteksi lokasi saya" pre-*selects*
   a zone the user can change. It never silently sets a price. (`zones.centroid` exists in
   `07` for exactly this — display only, never pricing.)
5. **The explainer line is the trust move.** "Biaya mengikuti jarak dari pool kami" turns a
   surcharge from arbitrary into causal. This only works if `09` §9.6 is resolved — **do not
   print a causal explanation for a number that isn't causal.** That is worse than silence.

---

## 11.3 Stops — type, never duration

```
┌──────────────────────────────────────┐
│ Berapa titik di Bandung?             │
│                                      │
│  [−]      3      [+]                 │
│                                      │
│  Titik 1  ○ Antar  ● Meeting  ○ Makan│
│  Titik 2  ○ Antar  ● Meeting  ○ Makan│
│  Titik 3  ○ Antar  ● Meeting  ○ Makan│
│                                      │
│  ⓘ Estimasi 10 jam kerja.            │
│    Termasuk paket 12 jam. ✓          │
└──────────────────────────────────────┘
```

Never ask for hours. The customer doesn't know; forcing a guess produces a wrong number
they will later hold you to. The engine translates type → dwell → hours (`09` §9.4.1).

**The `ⓘ` line is the causal chain made visible.** It is the difference between a black box
and a receipt.

Beyond `{{TOKEN}}` stops → `quote_only` (EC-PRC-004). A 15-stop day is a charter, not a
transfer, and the model shouldn't pretend otherwise.

---

## 11.4 The estimate result

Full contract in `09` §9.9. UX rules that carry the weight:

| Rule | Why |
|---|---|
| The word is **"Estimasi"**. Never "Total", never "Bayar" | An estimate is a conversation opener; a total is a promise |
| Breakdown always visible, not collapsed | A single number invites suspicion. A breakdown invites trust. |
| Exclusions inline, not footnoted (BR-007) | A hidden exclusion found at pickup costs more than a higher headline |
| `quote_only` → **no number at all** | Never a partial or guessed price (FR-PRC-006) |
| Rules fail to load → **no number**, WA CTA only | A wrong price is worse than no price (EC-PRC-001) |
| One dominant CTA: WhatsApp | `SWIFT_REDESIGN_PROTOTYPE_PRD.md` §4 |

---

## 11.5 Empty, loading, error states — specified, not discovered

| State | Behaviour |
|---|---|
| First load | Estimator is the **primary** interactive element. Not below the fold. |
| No corridor for the pair | "Kami belum punya harga tetap untuk rute ini." + WA CTA. **Never "not available"** — you *do* serve it, you just quote manually. |
| Rules loading | Skeleton on the price only. Inputs stay usable. |
| Rules failed | Estimator collapses to a WA CTA carrying whatever was selected. **Never a stale price.** |
| Offline | Cached shell + WA CTA (`wa.me` works offline; the OS queues it) |
| Zone selected, no class | Prompt inline. Don't compute. Don't show 0. |
| Computing | < 50ms. **No spinner.** A spinner on a 50ms operation makes it *feel* slower. |

---

## 11.6 Copy principles

- **Bahasa Indonesia**, all user-facing (NFR-USE-004). English only in code.
- Plain, not corporate. "Dijemput di mana?" not "Silakan tentukan lokasi penjemputan Anda."
- Never apologise for a price. State it and state why.
- Never use "hanya" or "cuma" before a number. It reads as defensive and invites haggling.
- The fraud warning is **direct**, not softened: this is the one place where blunt is correct.

---

## 11.7 Mobile-first, literally

380px is the **design target**, not the fallback. Desktop is the adaptation.

| Constraint | Value |
|---|---|
| Tap targets | ≥ 44×44px (NFR-USE-002) |
| Estimator inputs | One decision per screen height. No side-by-side pickers. |
| Thumb zone | Primary CTA in the bottom third |
| Contrast | WCAG 2.1 AA (NFR-USE-003) |
| Motion | Respect `prefers-reduced-motion` (NFR-USE-005) |
| Fonts | Subset + preload. A pricing tool that waits on a webfont is broken. |

---

## 11.8 Admin console UX (Phase 1)

| Principle | Detail |
|---|---|
| Keyboard-first | Paste `ref` → Enter → full request reconstructed. The 80% flow is one keystroke. |
| Density over whitespace | Opposite of the public site. This is a tool, not a brochure. |
| Margin is a **glance**, not a report | Colour-coded band next to the price (`05` §5.3.1) |
| Override needs a reason | Modal, reason code required, no bypass |
| Conflicts **name** the conflict | "Bentrok dengan BK-2026-00391 (07:00–19:00)", never "unavailable" |
| No dark patterns internally | The admin is not a user to be optimised. Show the real number. |

---

## 11.9 Component inventory (delta from the website PRD)

`SWIFT_REDESIGN_PROTOTYPE_PRD.md` §10 stands. **New for the estimator:**

`ZonePicker` (2-step, grouped, escape hatch) · `StopBuilder` (count + type) ·
`ClassPicker` (with pax-incl-driver label) · `DatePicker` (with multiplier hint) ·
`TripTypeToggle` · `EstimateCard` (breakdown + disclaimer + exclusions) ·
`QuoteOnlyCard` (no number, contact CTA) · `EstimatorErrorState` (WA CTA only)

**Phase 1:** `QuoteConsole` · `MarginBadge` (role-gated) · `OverrideModal` ·
`ConflictBanner` · `PaymentProofViewer` (signed URL, expiring)

---

## 11.10 Acceptance

- [ ] **NFR-USE-001: ≥ 4 of 5 first-time users complete an estimate unaided in < 90s**
- [ ] `Area lain` reachable from every zone input
- [ ] No free-text field ever feeds a price
- [ ] `quote_only` renders no number anywhere on screen
- [ ] Rules-unavailable renders no number and keeps the WA CTA (chaos-tested)
- [ ] Breakdown visible by default, not behind a disclosure
- [ ] Exclusions inline with the price
- [ ] 380px is the primary reviewed viewport
- [ ] `prefers-reduced-motion` honoured
- [ ] a11y scan: AA contrast, 44px targets, keyboard-navigable

---

*End 11.*
