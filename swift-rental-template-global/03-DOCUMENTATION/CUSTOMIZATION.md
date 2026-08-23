# Customization Guide

This is the full checklist of values to replace before publishing. Every
placeholder is deliberately generic so you can find it with a project-wide
search.

## Brand and identity

| Placeholder | Where |
|---|---|
| `Your Rental Company` | index.html, config.js, robots.txt, sitemap.xml, 404.html |
| `Your Company Ltd.` | index.html, config.js |
| `Chauffeur-Driven Car Rental & Airport Transfers` | Page title, OG/Twitter titles |
| `Chauffeur · Airport Transfer · Intercity` | Header sub-brand line |

## Domain and URLs

- Replace `https://example.com/` and `https://example.com` throughout.
- Update the `<link rel="canonical">`, `og:url`, and `twitter:*` URLs.
- Update every `<url><loc>` in `sitemap.xml`.
- Update the `Sitemap:` line in `robots.txt`.
- Update the `hreflang` alternates (`en`, `id`, `x-default`).
- Update `@id` values inside the JSON-LD graph.

## Contact channels

| Placeholder | Format |
|---|---|
| `+1 555 000 0000` | Human-readable phone |
| `+1-555-000-0000` | Dashed phone in JSON-LD |
| `15550000000`, `15550000001`, `15550000002` | WhatsApp digits (no +, used in `wa.me/...`) |
| `hello@example.com` | Email |
| `https://www.instagram.com/yourrentalcompany/` | Instagram profile |
| `@yourrentalcompany` | Instagram handle |

## Address and geo

- Street: `123 Example Street`
- City: `Your City`
- Region: `Your Region`
- Postal code: `00000`
- Country: `US` (ISO-3166-1 alpha-2)
- Coordinates: `0.0000, 0.0000` — replace with real latitude/longitude

## Currency and locale

- Language: `en` (`html lang="en"`)
- Locale: `en-US` (`og:locale content="en_US"`)
- Currency: `USD`, symbol `$`
- Currency formatting: the `fmt()` helper in `<script data-dc-script>` uses
  `Number(n).toLocaleString('en-US')` with a `$` prefix. Change both to
  switch currency (e.g. `de-DE` + `€` suffix).

## Opening hours

Fill `openingHoursSpecification` in the JSON-LD (and the `openingHours`
array in `config.js`). Use ISO days (`Monday`…`Sunday`) and 24-hour
`HH:MM` times.

## Service areas

Update `areaServed` in the JSON-LD and `config.js` with the cities you
actually serve. The dropdowns in the estimator (`origins`, `dests` in the
JS data block) also list city names — sync them.

## Payment methods

`paymentAccepted` in JSON-LD lists the payment types you support. Only
list what you actually accept.

## Fleet and prices

- Edit the `vehicles = [ ... ]` array in `<script data-dc-script>` inside
  `index.html`. Fields:
  - `name` — human-readable name shown on cards and dropdowns.
  - `pax` — passenger capacity (includes driver seat count as applicable).
  - `dk` — In-City 12-hour daily rate (number in your currency's smallest
    common unit — the template uses whole units, e.g. `125`). Use `null`
    if this tier is not offered for the vehicle (the card shows "Contact us").
  - `ai` — All-in daily rate (same rules as `dk`).
  - `type` — one of the filter categories (`MPV`, `SUV`, `Premium`,
    `Bus & Van`). Add to `filterList` to introduce new categories.
  - `slug` — used as a reference tag in the WhatsApp message.
  - `img` — relative path to the vehicle photo under `assets/armada/`.

- Replace the images in `assets/armada/` with your own. Keep the file
  names or update the `img` path to match.

## Routes

Edit `routesRaw = [ ... ]` in the JS data block. Fields:
- `from`, `to` — city names.
- `dur` — human-readable duration (e.g. `~ 3 hours`).
- `veh` — suggested vehicle name (should exist in `vehicles`).
- `price` — All-in starting price, or `null` for "Contact us".

## Services, steps, cancellation policy, FAQ, blog cards

Edit `servicesRaw`, `stepsRaw`, `cancelRaw`, `whyusRaw`, `galleryRaw`,
`faqsRaw`, `postsRaw` in the JS data block. Keep the FAQ text in sync with
the `FAQPage` JSON-LD in the `<head>` — Google requires the visible
questions and answers to match the schema exactly.

## Testimonials

The template includes one testimonial card explicitly labeled as demo
content. Either replace it with a real customer quote (with attribution)
or remove the block entirely. Do not present placeholder text as a
genuine review.

## Social sharing image

Replace `assets/og-image.svg` with a real PNG or JPG image at 1200×630
resolution, and update the `og:image` / `twitter:image` URLs from
`assets/og-image.png` to your file name.

## Favicon and web app icons

Replace `favicon.svg` with your own SVG (any square vector will render
crisply in browser tabs). Consider adding a `favicon.ico` and PNG icons
for iOS (`apple-touch-icon.png`) and Android (declared in
`site.webmanifest`).

## Legal / terms

Add a Terms of Service page and Privacy Policy if your jurisdiction
requires them. Link them from the footer.
