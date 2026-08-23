# Swift Rental — Global Template

An English-first, framework-free rental-car website template with a bonus
Indonesian localization. Opens by double-clicking `index.html`. No Node.js,
no build tools, no external services required.

## Documentation index

| File | What it covers |
|---|---|
| [`GETTING_STARTED.md`](GETTING_STARTED.md) | Open the site, understand the file layout, first edits. |
| [`CUSTOMIZATION.md`](CUSTOMIZATION.md) | Every placeholder to replace: brand, contact, fleet, prices, images. |
| [`SEO_SETUP.md`](SEO_SETUP.md) | Domain, canonical, sitemap, robots, Open Graph, JSON-LD, hreflang. |
| [`FIGMA_LOCALIZATION_CHECKLIST.md`](FIGMA_LOCALIZATION_CHECKLIST.md) | How to align the Figma source with the English deliverable. |
| [`QUICKSTART_ID.md`](QUICKSTART_ID.md) | Panduan cepat versi Bahasa Indonesia. |

## Which folder do I edit?

- `01-WEBSITE-EN/` — primary product. Edit this for your live site.
- `02-WEBSITE-ID/` — bonus Indonesian version. Optional to deploy.

Each website folder contains:

```
index.html          The site (all pages, one file, hash-based routing).
support.js          Design-canvas runtime. Do not edit.
config.js           Documentation of the values you must replace.
favicon.svg         Placeholder favicon.
site.webmanifest    PWA manifest.
robots.txt          Search-engine directives.
sitemap.xml         Sitemap.
404.html            Custom not-found page.
assets/armada/*.png Demo vehicle images (replace with your own).
assets/og-image.svg Placeholder social-sharing image (replace with a real PNG).
```

## Content that must be replaced before publishing

- Brand name, legal entity, tagline.
- Production domain (currently `https://example.com/`).
- Phone, WhatsApp number, email.
- Physical address and geo-coordinates.
- Social profile URLs.
- Opening hours.
- Service areas (cities you serve).
- Vehicle list and pricing.
- Popular routes.
- Social-sharing image (`assets/og-image.png`).
- Any testimonials (currently labeled as demo content — replace or remove).

Never publish the template with placeholder data as if it were real.

## Support scope

Support covers the template as delivered. It does not cover custom feature
development, hosting, domain purchase, third-party integrations, or
content writing.
