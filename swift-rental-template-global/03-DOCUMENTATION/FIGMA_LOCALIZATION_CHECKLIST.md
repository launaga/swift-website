# Figma Localization Checklist

The source Figma file (`swift rental car.fig`) ships as a binary. It is
**not** included in this global package — treat it as reference material
that lives alongside your web deliverable. If you have the file open, use
this checklist to align it with the English website.

> The English website is the source of truth. If a Figma frame and the
> HTML disagree, the HTML wins.

## Setup

1. Duplicate the Figma file — never edit the master.
2. Rename the duplicate: `Swift Rental — Global (EN).fig`.
3. Add a cover page named `Cover / EN` with the English tagline.
4. Keep the Indonesian version (if any) as `Swift Rental — ID.fig`.

## Page names (Figma "Pages" panel)

Rename Indonesian page names to English:

| Old (ID) | New (EN) |
|---|---|
| Beranda | Page / Home |
| Armada | Page / Fleet |
| Travel | Page / Travel |
| Tentang | Page / About |
| Kontak | Page / Contact |
| Blog | Page / Blog |
| Kaver | Cover / EN |

## Frame names

Use the `Section / <Name>` convention so exported PDFs read cleanly:

- `Section / Hero`
- `Section / Estimator`
- `Section / Verified Channel`
- `Section / Fleet`
- `Section / Services`
- `Section / Popular Routes`
- `Section / Booking Steps`
- `Section / Why Us`
- `Section / Gallery`
- `Section / Cancellation`
- `Section / Testimonial (Demo)`
- `Section / Travel Estimator`
- `Section / FAQ`
- `Section / Contact Form`
- `Section / Footer`

## Layer names

Rename Indonesian labels to English at the layer level. Common ones:

| Old | New |
|---|---|
| Hero / Judul | Hero / Headline |
| Hero / Subjudul | Hero / Subhead |
| Tombol Booking | Button / Book via WhatsApp |
| Tombol Lihat Armada | Button / Explore the Fleet |
| Kartu Armada | Vehicle Card |
| Kartu Rute | Route Card |
| Kartu Layanan | Service Card |
| Ikon WA | Icon / WhatsApp |

## Component names

- `Component / Button / Primary`
- `Component / Button / Secondary`
- `Component / Button / Ghost`
- `Component / Vehicle Card`
- `Component / Route Card`
- `Component / Service Card`
- `Component / FAQ Item`
- `Component / Estimator`
- `Component / Nav / Desktop`
- `Component / Nav / Mobile`
- `Component / Footer`

## Text styles

Match the web build's typography:

- `Display / 62` — Bricolage Grotesque 800, `-3%` tracking
- `Display / 42` — Bricolage Grotesque 800, `-2.5%` tracking
- `Heading / 26` — Bricolage Grotesque 700, `-2%` tracking
- `Body / 16` — Inter Tight 400, 1.6 line-height
- `Body / 14` — Inter Tight 400, 1.55 line-height
- `Mono / 12 Caps` — IBM Plex Mono 500, `14%` tracking, uppercase
- `Mono / 11 Caps` — IBM Plex Mono 500, `10%` tracking, uppercase

## Color styles

- `Ink / 900` `#0B0F1A`
- `Ink / 800` `#1A2230`
- `Ink / 600` `#5B6577`
- `Paper / 0` `#FFFFFF`
- `Paper / 50` `#F4F6FA`
- `Line / 100` `#E3E8F0`
- `Blue / 700` `#1452C4`
- `Blue / 500` `#2E6FE0`
- `Blue / 300` `#5E93F2`
- `Blue / 100` `#9DC0FF`

## Variables (Figma Variables)

Create a `Localization` variable collection with:

- `brand.name` (string) — default `Your Rental Company`
- `brand.entity` (string) — default `Your Company Ltd.`
- `brand.tagline` (string) — default `Chauffeur-Driven Car Rental`
- `contact.phone` (string) — `+1 555 000 0000`
- `contact.whatsapp` (string) — `+1 555 000 0000`
- `contact.email` (string) — `hello@example.com`
- `address.line1` (string) — `123 Example Street`
- `address.city` (string) — `Your City`
- `currency.symbol` (string) — `$`
- `currency.code` (string) — `USD`
- `locale.lang` (string) — `en`

Bind these to text layers using `Apply Variable` so switching language
mode swaps the whole file.

## Interface copy (button labels, form labels, error states)

| Purpose | English |
|---|---|
| Primary CTA | Check Availability |
| Secondary CTA | Explore the Fleet |
| Booking CTA | Book via WhatsApp |
| Form label — Name | Name |
| Form label — Message | Message |
| Form placeholder — Name | Your name |
| Form placeholder — Message | Which vehicle or route, dates, and passenger count… |
| Form submit | Send via WhatsApp → |
| Estimator tier — In-City | In-City 12-Hour |
| Estimator tier — All-in | All-in |
| Estimator field — From | From |
| Estimator field — To | To |
| Estimator field — Vehicle | Vehicle |
| Estimator field — Duration | Duration (days) |
| Estimator CTA | Continue Booking → |
| Empty fleet filter | No vehicles match this filter |
| Loading state | Loading… |
| Form error — Name missing | Please enter your name. |
| Form error — Message missing | Please enter a short message. |
| Toast — WhatsApp opened | Opening WhatsApp… |

## Mobile layouts

Set the responsive frame widths to `375`, `768`, and `1200`. Confirm the
navigation collapses to the mobile drawer below `820`, matching the CSS
breakpoint in `index.html`.

## Prototype interactions

- Header nav items → smooth-scroll to matching section on Home, or route
  to the corresponding page frame otherwise.
- Fleet filter chips → toggle visibility of vehicle cards.
- Estimator tier toggle → swap displayed rate rows.
- Estimator "Continue Booking" → external `wa.me` link.
- Gallery card → open lightbox overlay.
- FAQ item → expand/collapse the answer.

## English text expansion

English translations of Indonesian phrases can run 10–25% longer. Give
buttons and cards extra horizontal padding, allow `min-content` widths on
CTA rows, and re-flow multi-line hero headings.

## English-first cover page

Add a cover frame at 1600×1000:
- Bold English title: `Swift Rental — Global`
- Subtitle: `Chauffeur-Driven Car Rental Template · English + Indonesian`
- Legal note: `Demo content. Replace all placeholders before publishing.`

## Product preview frames

Export at 2x:
- `Preview / Home / Desktop`
- `Preview / Home / Mobile`
- `Preview / Fleet / Desktop`
- `Preview / Estimator / Detail`
- `Preview / Contact / Desktop`

## What was NOT done automatically

The `.fig` file is a binary produced by Figma. This template package does
not modify Figma files programmatically. Apply this checklist by hand
inside Figma, then re-export any images the website uses.
