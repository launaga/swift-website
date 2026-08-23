# SEO Setup Guide

This template ships with sensible on-page and technical SEO defaults.
Everything below explains how to swap the placeholders for your real
values and how to validate the result.

## 1. Replace the placeholder domain

The template uses `https://example.com/` everywhere a canonical URL,
Open Graph URL, sitemap `<loc>`, robots `Sitemap:` line, or JSON-LD `@id`
appears. Do a project-wide find-and-replace with your production origin,
keeping the trailing slash. Then confirm:

```
grep -R "example.com" 01-WEBSITE-EN/
```

The result should be empty (or only reference files you deliberately kept
as templates).

## 2. Update canonical URLs

Every indexable page needs its own `<link rel="canonical">`. In this
single-file build the homepage's canonical is the site root. If you add
routes as separate HTML files later, each file needs its own canonical.

## 3. Update the sitemap

Edit `sitemap.xml`:
- Set the correct `<loc>` for every page you want indexed.
- Update `<lastmod>` when content changes materially.
- Remove entries that no longer exist.

If English and Indonesian are both live, keep each `<url>` block's
`xhtml:link rel="alternate"` list reciprocal and matching between the two
sitemaps.

## 4. Configure robots.txt

`robots.txt` allows all crawlers by default and points to the sitemap.
Keep the `Sitemap:` line accurate. Disallow paths you do not want indexed
(e.g. staging directories).

## 5. Update the Open Graph image

Replace `assets/og-image.svg` with a real PNG at 1200×630 (the standard
Facebook/LinkedIn/Twitter card size). Save it as `assets/og-image.png`
and update the `og:image` and `twitter:image` `<meta>` tags.

## 6. Configure the AutoRental schema

The JSON-LD block in the `<head>` contains an `AutoRental` entity. Fill
each field with real values:

- `name`, `url`, `logo`, `image`, `description`
- `telephone`, `email`
- `priceRange` — Google accepts `$`/`$$`/`$$$`/`$$$$` or a specific range
- `currenciesAccepted` — ISO 4217 code (`USD`, `EUR`, `IDR`, ...)
- `paymentAccepted` — comma-separated list of your accepted methods
- `address` — full postal address
- `geo` — real latitude/longitude (decimal degrees)
- `openingHoursSpecification` — real hours per day
- `areaServed` — cities/regions you actually operate in
- `sameAs` — real, publicly owned social profile URLs
- `contactPoint` — reservations contact
- `hasOfferCatalog` — the services you actually offer

Do not include a property if you do not have real data to back it. Do not
add `Review`, `AggregateRating`, awards, or customer counts unless the
underlying data is real.

## 7. Add real address and coordinates

Update `address.streetAddress`, `addressLocality`, `addressRegion`,
`postalCode`, and `addressCountry` (ISO-3166-1 alpha-2). Set `geo.latitude`
and `geo.longitude` to your business's real coordinates (any mapping
service returns them for a given address).

## 8. Legitimate opening hours

`openingHoursSpecification` is an array of objects. Each object lists
`dayOfWeek` (any subset of Monday…Sunday) and `opens`/`closes` in 24-hour
`HH:MM` format. The template ships with a 24/7 placeholder — replace it.

## 9. Configure service areas

Set `areaServed` in the JSON-LD to the cities or regions you serve. Keep
this in sync with the dropdowns in the estimator (`origins`, `dests` in
the JS data block).

## 10. Add social profile URLs

`sameAs` should list only real, publicly owned profiles. Remove entries
you do not actually operate. Do not link to profiles that do not belong
to your business.

## 11. Handling English and Indonesian hreflang

If both language versions are deployed under one production origin (for
example, English at `/` and Indonesian at `/id/`), the head of each
document should include:

```
<link rel="alternate" hreflang="en" href="https://your-domain.com/">
<link rel="alternate" hreflang="id" href="https://your-domain.com/id/">
<link rel="alternate" hreflang="x-default" href="https://your-domain.com/">
```

The rules:
- Reciprocal: each language must link to the other (and to itself).
- Consistent: the URL patterns above must match your actual deployment.
- Absolute: use full `https://...` URLs, not relative paths.

If you only deploy one language, remove the hreflang lines and drop the
alternates from the sitemap.

## 12. Validate structured data

Use both:
- Google Rich Results Test: <https://search.google.com/test/rich-results>
- Schema.org Validator: <https://validator.schema.org/>

Paste the URL (once deployed) or the raw HTML. Fix every warning that
relates to invalid syntax or missing required properties.

## 13. Test with Google Rich Results

Rich Results eligibility depends on both valid schema and content
quality. Even a valid `FAQPage` block does not guarantee a rich result —
Google evaluates the page as a whole. Do not add `Review`,
`AggregateRating`, `Product`, or `BlogPosting` schema unless the page
genuinely satisfies its type.

## 14. Use the Schema.org Validator

For general Schema.org correctness (outside Google-specific rich-result
eligibility), use <https://validator.schema.org/>. It parses the JSON-LD
graph, flags syntax errors, and warns about unrecognized properties.

## 15. Submit the sitemap to Google Search Console

1. Verify domain ownership in Search Console.
2. Under **Sitemaps**, submit `sitemap.xml`.
3. Under **URL Inspection**, request indexing for the homepage.
4. Monitor Coverage and Enhancements reports for the first two weeks.

## 16. Valid schema does not guarantee a rich result

Rich results are always a Google decision. Valid structured data is a
necessary condition, not a sufficient one. Focus on content quality,
crawlability, mobile usability, and page speed alongside schema.

## 17. Never add fake reviews or hidden schema

- Do not fabricate `Review` entries or `AggregateRating` counts.
- Do not put schema on the page that does not describe what a visitor
  can see and interact with.
- Do not hide FAQ text behind CSS to inflate word count.

Fake or hidden structured data can result in a manual action from Google
and remove your site from search entirely.

## Additional recommendations

- Serve the site over HTTPS.
- Add long-cache headers to `assets/`.
- Add an `apple-touch-icon.png` and update `site.webmanifest` icons.
- Keep the total DOM under a few thousand nodes for good CWV scores.
