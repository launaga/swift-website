# Getting Started

## 1. Open the site locally

Double-click `01-WEBSITE-EN/index.html` in your browser. That's it — the
site runs without a build step or a server.

If your browser blocks local file access for the fonts (rare), start a
static server from the folder:

```
cd 01-WEBSITE-EN
python3 -m http.server 8080
# open http://localhost:8080/
```

## 2. Understand the file layout

`index.html` contains all pages. The pages are switched via URL hash
(e.g. `#travel`, `#about`, `#contact`, `#blog`). All copy lives directly in
the HTML — search the file for any English string you want to change and
edit it inline. The `<script data-dc-script>` block near the bottom holds
the data-driven lists (fleet, routes, services, steps, cancellation
policy, FAQs, blog cards, contacts).

## 3. First edits — the mandatory ten

Before you publish, edit these ten items. Do them in this order and you
will not miss anything.

1. **Brand name.** Search-and-replace `Your Rental Company` in
   `index.html`, `config.js`, `robots.txt`, `sitemap.xml`, and `404.html`.
2. **Legal entity.** Replace `Your Company Ltd.` similarly.
3. **Domain.** Replace `https://example.com/` (and `https://example.com`)
   throughout with your production origin. Include the trailing slash where
   it exists in the source.
4. **Phone + WhatsApp number.** Replace `+1 555 000 0000`, `+1-555-000-0000`,
   and the WhatsApp digits `15550000000`, `15550000001`, `15550000002`.
5. **Email.** Replace `hello@example.com`.
6. **Address + geo.** Replace `123 Example Street`, `Your City`,
   `Your Region`, `00000`, and update the `geo` coordinates in the JSON-LD.
7. **Social profiles.** Replace `yourrentalcompany` (and remove the
   Instagram entry if you do not have one).
8. **Opening hours.** Replace the placeholder 24/7 schedule in the JSON-LD.
9. **Fleet + prices.** Edit the `vehicles = [ ... ]` array in the
   `<script data-dc-script>` block.
10. **Sharing image.** Replace `assets/og-image.svg` with a real 1200×630
    PNG named `assets/og-image.png`, and update the OG/Twitter references.

See `CUSTOMIZATION.md` for the complete list.

## 4. Verify

- Open every page (`#`, `#travel`, `#about`, `#contact`, `#blog`).
- Try the estimator, the fleet filter, the WhatsApp button, and the
  contact form's WhatsApp handoff.
- Open the browser DevTools console — there should be no errors.
- Validate structured data with the Google Rich Results Test
  (<https://search.google.com/test/rich-results>) and the Schema.org
  Validator (<https://validator.schema.org/>).

## 5. Deploy

The template is static HTML. Any static host works — GitHub Pages, Vercel,
Netlify, Cloudflare Pages, S3+CloudFront, or your own web server. Upload
the contents of `01-WEBSITE-EN/` to the site root.

If you also deploy the Indonesian version, put `02-WEBSITE-ID/` under a
sub-path such as `/id/` and confirm the hreflang alternates match your
final URL structure.
