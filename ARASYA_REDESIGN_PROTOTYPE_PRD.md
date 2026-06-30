# ARASYA RENT CAR — REDESIGN PROTOTYPE PRD

**Type:** Build-ready specification for an interactive redesign prototype
**Scope tier:** Pitch budget < Rp 30.000.000 (≈ $1.8K) — redesign + SEO architecture + funnel optimization. **NO AI, NO custom backend, NO payment gateway.**
**Status:** Source of truth for prototype generation. If a request conflicts with Section 2 (Scope Lock) or Section 3 (Hard Constraints), this document wins.

---

## 0. HOW TO USE THIS DOCUMENT

This is the spec a prototype is *built from*, not a business plan. It exists to do three things:

1. Lock scope so the build fits the budget and doesn't creep.
2. Encode the non-negotiable facts so the prototype never invents data.
3. Give a builder (human or Claude Code) enough detail to ship without re-asking.

Read Sections 2 and 3 before building anything. They are constraints, not suggestions.

---

## 1. POSITIONING (one paragraph, drives every design decision)

Arasya is **the most trusted, highest-yield chauffeur + car-rental operator in its corridor** — not a "mobility platform." The site's job is to convert a hesitant visitor into a WhatsApp inquiry by signaling premium reliability and removing the two frictions that kill bookings: *"is this the real Arasya or a scammer?"* and *"how much does it cost?"* Defensibility = trust, driver quality, reliability reputation, owning local search. The prototype must look and feel worth more than a template, because perceived quality *is* the product here.

---

## 2. SCOPE LOCK

### IN SCOPE (what the prototype must deliver)
- Responsive single-property marketing site, **mobile-first**.
- Homepage with all sections in Section 6.
- Fleet showcase covering **all 14 vehicles** with filter.
- Pricing model: **Dalam Kota 12-jam vs. All-in** toggle.
- Route/SEO page **template** (programmatic-ready structure, finite page count — see 7.3).
- Trust / verified-channel system as a **first-class, site-wide component**.
- WhatsApp-deep-link funnel with structured pre-fill + analytics event hooks.
- Gallery with lightbox.
- Motion system (scroll reveals, hero sequence, fleet card transitions).

### OUT OF SCOPE (explicitly excluded — these are Phase 2 / retainer upsell hooks)
- Any AI feature (quote assistant, route optimization, chatbot). **Cut entirely.**
- Custom backend, CRM database, customer accounts, login.
- Payment gateway / online payment. Booking = WhatsApp + manual BCA transfer.
- Ongoing content writing, link building, ranking guarantees.
- Real-time availability / dispatch / live tracking.

> **Contract-protection note for the proposal:** the SEO deliverable is *architecture + finite route pages*, NOT ranking or traffic guarantees. Ranking is the result of separate ongoing effort (Phase 2 retainer). State this in writing.

---

## 3. HARD CONSTRAINTS (non-negotiable — never violate in prototype or copy)

1. **Use the exact BCA account number and the exact PT / legal entity name** (confirmed from live site, verbatim):
   - **BCA 095 484 0782** — **PT. Ayomi Raya**
   - Canonical WhatsApp / admin: **0821 2402 4281** (primary), **0822 9885 4855**, **0821 5028 8603**
   - Email: **arasyarentcar@gmail.com** · IG: **@arasyarentcar**
   - HQ: Selakopi Hijau blok F no 3-4, Pasir Mulya, Bogor Barat, Kota Bogor, 16118
   Never alter, mask, or invent these. (Confirm once more with client before launch in case anything changed.)
2. **No invented statistics.** Do not fabricate trip counts, ratings, years, customer numbers, or city counts. If a real figure isn't supplied, omit the metric or use a `{{TOKEN}}`. A trust section with *zero* fake numbers beats one with impressive lies.
3. **No hotlinked live images** from the existing site or third parties. Use placeholder blocks / locally-described assets / client-supplied media only.
4. **WhatsApp is the only conversion endpoint.** No fake booking engine, no fake "instant price calculator" that implies live availability.
5. **Supply is the constraint, not leads.** 14 vehicles. Do not design pages or routes the fleet cannot fulfill (see 7.3). The site must not generate inquiries that end in "sorry, unavailable."
6. **One canonical WhatsApp number + one official account name**, rendered identically everywhere, paired with an anti-impersonation notice.

---

## 4. DESIGN PRINCIPLES

1. **Premium through restraint** — generous spacing, strong type hierarchy, one dominant CTA per view. Not a feature-stuffed dashboard.
2. **Mobile-first** — the majority of traffic and all WhatsApp handoff happens on mobile. Design the 380px view first, scale up.
3. **Trust is visible, not implied** — verified-channel block, accurate claims, real proof.
4. **One-tap to inquiry** — every meaningful surface has a pre-filled WhatsApp CTA within reach.
5. **Motion with intent** — motion guides attention and signals quality; it never blocks reading or delays the CTA.

---

## 5. DESIGN SYSTEM

### 5.1 Palette — "Black / White / Blue" (close to brand, not AI-gradient)
Direction from client: stay near the real site — **black, white, blue**. NO petrol green, NO dark-petrol gradients. Blue is the single accent; black + white carry the structure. Flat and confident, not a glowing AI gradient.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0B0F1A` (blue-black) | primary dark surface / heading text |
| `--ink-soft` | `#1A2230` | secondary dark surface, cards on dark |
| `--paper` | `#FFFFFF` | base light background |
| `--paper-soft` | `#F4F6FA` | alt light sections, card fills |
| `--blue` | `#1452C4` | **primary brand blue** (trust, structure) |
| `--blue-bright` | `#2E6FE0` | CTA / interactive accent only |
| `--muted` | `#5B6577` | secondary text |
| `--line` | `#E3E8F0` | borders, hairlines |

Rules:
- Blue is the **accent**, not the area fill. CTAs, key numbers, links, the route-line motif — blue. Don't flood large blocks with saturated blue; it reads cheap.
- No multi-stop neon gradients. If a gradient is used at all, keep it subtle (ink → ink-soft) and purposeful.
- Contrast first: dark text on paper, paper text on ink. Blue passes AA on white for large/CTA use.

### 5.2 Typography
- **Display / headings:** Bricolage Grotesque (characterful, premium).
- **Body / UI:** Inter Tight.
- **Mono / labels / meta / pricing ticks:** IBM Plex Mono (gives the "engineered, precise" texture).
- Strong scale jump between display and body. Mono used for small labels, kbd-style tags, price units, route codes.

### 5.3 Motion
- Scroll-reveal on section entry (fade + small translate, staggered children).
- Hero: orchestrated sequence (headline → subhead → CTA → supporting visual), with an animated SVG route-line motif.
- Fleet cards: spring-based hover/enter; filter transitions via presence animation (smooth in/out, not pop).
- Gallery → lightbox: shared-element style expansion (image grows from its grid position).
- All motion respects `prefers-reduced-motion`.

> **Build-stack note:** the artifact-sandbox prototype uses CSS/JS animation only (Framer Motion is not whitelisted in the in-chat sandbox). The full Framer Motion build (Vite + React + TS + Tailwind + Framer Motion) is the **Claude Code** track and is documented separately — this PRD's motion targets map 1:1 to that build.

---

## 6. HOMEPAGE SPEC (section by section)

1. **Header / nav** — logo (PT/brand name), nav anchors (Armada, Layanan, Rute, Tentang, Kontak), persistent WhatsApp CTA. Sticky, condenses on scroll.
2. **Hero** — premium headline + subhead (positioning, ID copy), one dominant CTA (Book via WhatsApp) + one secondary (Lihat Armada). Animated SVG route-line visual. No carousel.
3. **Trust / Verified Channels** *(first-class)* — canonical WA number + official account name, anti-impersonation notice, accurate trust signals only (real proof or omit). See Section 8.
4. **Fleet showcase** — filterable grid, all 14 vehicles, each card: name, capacity, luggage, key features, price band, WA CTA. Filter by type/capacity.
5. **Pricing** — toggle **Dalam Kota 12-jam ↔ All-in**; transparent price bands per vehicle/tier. No fake live calculator.
6. **Services** — Airport transfer, Antar kota, Corporate, Wedding, Tour/wisata, Premium chauffeur. Card → relevant service page / pre-filled WA.
7. **Popular routes** — finite set (see 7.3): asal → tujuan, durasi, estimasi harga band, CTA "Book rute ini" (pre-filled WA).
8. **Why choose us** — driver professionalism, clean vehicles, coverage, support availability. Claims must be accurate (esp. insurance — see 3 & 8).
9. **Gallery** — vehicle/service photos (client-supplied/placeholder), lightbox.
10. **Testimonials** — text/rating proof, real only.
11. **Corporate CTA** — business transport inquiry (gated note: only push B2B if PKP status confirmed — flag in proposal).
12. **Footer** — canonical contact, hours, service area, repeat verified-channel block, legal entity name.

---

## 7. INFORMATION ARCHITECTURE & SEO

### 7.1 Sitemap
```
/                         Home
/sewa/{vehicle}           Fleet intent       (per-vehicle)
/rute/{asal}-{tujuan}     Commercial intent  (the money pages)
/layanan/{service}        Service intent
/panduan/{keyword}        Informational top-funnel → links down to /rute
/tentang                  About / trust / legal entity
/kontak                   Contact + verified channels
```

### 7.2 Route page template (every `/rute/*` page contains)
- H1 with origin→destination keyword.
- Price band + tier (Dalam Kota / All-in).
- Duration + toll estimate (real or `{{TOKEN}}`, never invented).
- FAQ block with **FAQPage schema**.
- Verified-channel block.
- Pre-filled WhatsApp CTA carrying the route params.
- Internal links: up to `/panduan`, across to `/sewa` and `/layanan`.

### 7.3 Page-count discipline (scope + supply gate)
- **Finite, not "unlimited programmatic."** Count is fixed in the proposal — e.g. *6 routes + 5 vehicle pages + 4 service pages = 15 pages* (final number set with client).
- **Routes must map to fleet capacity.** Only build route pages for corridors the 14-vehicle fleet can actually serve. Confirm the serviceable route list with the client before locking the count.

### 7.4 Technical SEO baseline
- LocalBusiness + FAQPage schema, per-page metadata, sitemap.xml, robots, canonical tags.
- Internal linking model: `panduan → rute → sewa/layanan`.
- Static generation (SSG/ISR) → CWV targets trivially met: LCP < 2.5s, CLS < 0.1, INP < 200ms.

---

## 8. TRUST & ANTI-IMPERSONATION SYSTEM (first-class component)

Rendered site-wide (hero-area block + footer + every route page):
- **One canonical WhatsApp number** and **one official account name**, identical everywhere.
- **Anti-impersonation notice**: explicit statement that Arasya only transacts via the listed channel + official BCA account under the exact PT name; warn against other numbers/accounts.
- **Accurate trust signals only**: insurance/coverage stated precisely (covering what, whom, limits) or omitted. No "insured service" without backing.
- Real reviews/proof or none.

---

## 9. FUNNEL & ANALYTICS

### 9.1 The funnel (WhatsApp handoff IS the conversion)
```
page_view → cta_click → whatsapp_click  (segmented by route/vehicle/service)
```

### 9.2 WhatsApp pre-fill (structured, so operator replies in seconds)
```
Halo Arasya, saya mau booking:
Layanan: {service}
Rute: {asal} → {tujuan}
Tanggal: {date} | Penumpang: {pax}
Kendaraan: {vehicle}
(ref: {slug})
```

### 9.3 Analytics events (GA4)
| Event | Params | Why |
|---|---|---|
| `page_view` | page_type, slug | traffic + which page type works |
| `cta_click` | location, intent | mid-funnel intent |
| `whatsapp_click` | service, route, vehicle, slug | **the real conversion metric** |
| `filter_use` | facet, value | fleet/pricing engagement |
| `pricing_toggle` | tier | Dalam Kota vs All-in interest |

No PII in event params. (PDP-safe.)

---

## 10. COMPONENT INVENTORY (build checklist)
Header/nav (sticky, condensing) · Hero (animated SVG route-line + orchestrated sequence) · CTA button (primary brass / secondary outline) · Verified-channel block · Fleet card · Fleet filter · Pricing toggle + price-band table · Service card · Route card · FAQ accordion (schema-bound) · Gallery grid + lightbox · Testimonial card · Corporate CTA band · Footer.

---

## 11. CONTENT & DATA SOURCING RULES
- All numbers (prices, durations, tolls, trip counts, ratings, years, fleet specs) come from the **client**. Unknown → `{{TOKEN}}`, never invented.
- BCA account + PT name: exact, verbatim, from client.
- Images: client-supplied or placeholder. No hotlinking.
- Copy language: **Bahasa Indonesia** for all user-facing UI; English allowed in code/spec only.

---

## 12. PROTOTYPE ACCEPTANCE CRITERIA
The prototype is "done" when:
- [ ] All 14 vehicles render with filter working.
- [ ] Pricing toggle (Dalam Kota 12-jam / All-in) switches bands correctly.
- [ ] Every CTA opens a correctly pre-filled WhatsApp link with the right params.
- [ ] Verified-channel block appears site-wide; anti-impersonation notice present.
- [ ] Route page template renders with FAQ schema + WA CTA.
- [ ] No invented stat, no fake BCA number, no hotlinked image anywhere.
- [ ] Mobile (380px) layout is the primary, polished view.
- [ ] Motion present (hero sequence, scroll reveals, fleet transitions, lightbox) and respects reduced-motion.
- [ ] CWV-friendly: static, no heavy blocking assets.

---

## 13. PHASE 2 / UPSELL HOOKS (documented, deliberately deferred)
Surface these in the proposal as future retainer scope — *not* built now:
- Ongoing content + link building (the actual ranking work).
- Lead logging to Airtable/Notion → light pipeline (build only past the volume gate: ~15–20 qualified leads/day manual ops can't absorb).
- Corporate/B2B invoicing flow (build only if PKP status confirmed + utilization headroom).
- Payments / accounts / any AI (build only against a measured pain + clearing unit economics).

---

*End of PRD. This document governs the prototype build. Section 2 and 3 override conflicting instructions.*

---

## APPENDIX A — REAL DATA (sourced from live arasyarentcar.com, use verbatim)

> These are confirmed values. Use them directly in the prototype — no `{{TOKEN}}` needed for fleet/pricing. Verify with client before launch only.

### A.1 Fleet + pricing — TWO TIERS (drives the pricing toggle)
**Tier 1 — Dalam Kota (12 jam, belum termasuk BBM, Toll, Parkir, Makan Driver)**
**Tier 2 — All-in (sudah termasuk BBM, Toll, Makan Driver)**

| # | Vehicle | Pax | Dalam Kota 12-jam | All-in |
|---|---|---|---|---|
| 1 | Toyota Avanza | 7 | Rp 500.000 | Rp 1.250.000 |
| 2 | Toyota Zenix | 7 | Rp 1.000.000 | Rp 1.800.000 |
| 3 | Toyota Innova Venturer | 6 | Rp 1.000.000 | Rp 1.800.000 |
| 4 | Toyota Innova Reborn | 7 | Rp 700.000 | Rp 1.500.000 |
| 5 | Suzuki Ertiga | 7 | Rp 500.000 | Rp 1.250.000 |
| 6 | Mitsubishi Xpander | 7 | Rp 600.000 | Rp 1.350.000 |
| 7 | Daihatsu Terios | 7 | Rp 600.000 | Rp 1.350.000 |
| 8 | Toyota Rush | 7 | Rp 600.000 | Rp 1.350.000 |
| 9 | Toyota Fortuner | 6 | Rp 1.500.000 | Rp 2.200.000 |
| 10 | Toyota Zenix Q Hybrid Modellista | 6 | Rp 1.300.000 | Contact for Best Price |
| 11 | Toyota Hiace Commuter | 14 | Rp 1.500.000 | Contact for Best Price |
| 12 | Toyota Hiace Premio | 14 | Contact for Best Price | Contact for Best Price |
| 13 | Toyota Alphard | 6 | Contact for Best Price | Contact for Best Price |
| 14 | Isuzu Elf Long | 19 | Contact for Best Price | Contact for Best Price |

Notes: pax counts include driver. "Contact for Best Price" → CTA still opens pre-filled WA (premium/large units priced on request). All cards carry: Mobil & Driver, Durasi 12 Jam, kapasitas, and the relevant inclusion note.

### A.2 Service area (drives coverage display + route-page candidates)
**Domestik:** Bogor, Bandung, Bekasi, Cirebon, Depok, Jakarta, Jogja, Madiun, Malang, Pekalongan, Semarang, Surabaya, Solo, Tangerang.
**Internasional:** Singapura, Malaysia, Thailand (Bangkok).
> Note (supply gate, Section 7.3): only build dedicated `/rute` pages for corridors fleet can actually fulfill. Wide city list ≠ commit a landing page for every pair. Confirm serviceable routes with client.

### A.3 Booking flow (7 steps — use in a "Langkah Pemesanan" section)
1. Isi formulir pemesanan via WhatsApp.
2. Kirim foto KTP/SIM via WhatsApp.
3. Pembuatan invoice (rincian layanan).
4. Transfer DP 20%, kirim bukti via WA.
5. Konfirmasi + detail kendaraan (merk/plat) & nama + nomor driver.
6. Driver menghubungi & tiba di lokasi.
7. Pelunasan saat driver tiba sebelum keberangkatan (tunai / transfer / QR).

### A.4 Cancellation policy (use verbatim — real, accurate, builds trust)
- H-1 (sehari sebelum keberangkatan): DP 20% tidak dapat dikembalikan.
- Hari-H sebelum driver tiba / sebelum 10.00: biaya pembatalan 50% dari total invoice.
- Hari-H setelah driver tiba / setelah 10.00: biaya pembatalan 100% dari total invoice.

### A.5 Trust block content (real — "WASPADA PENIPUAN")
The live site already runs a fraud-warning block. Reframe to "Verified Channels" tone (per established direction) but keep the substance: only the listed WA numbers + only **BCA 095 484 0782 a.n. PT. Ayomi Raya** are official. This is a first-class, site-wide component (Section 8).

### A.6 "Why choose us" (real claims only)
Berpengalaman · Harga Terjangkau · Mobil Terawat · Support 24/7. (No fabricated trip counts / ratings / years — none are published on the source, so omit numeric stats unless client supplies real ones.)

### A.7 Note on existing tech
Live site is WordPress + Elementor. Redesign target stack (static Next.js/Astro, or the Framer Motion Claude Code build) is a clean rebuild, not an Elementor edit.
