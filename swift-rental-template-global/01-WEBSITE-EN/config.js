/*
 * Template configuration — English default.
 *
 * This file is documentation-first: it describes every value the buyer must
 * replace before publishing. The default index.html does not read this file
 * dynamically; each value below is also present in index.html (and in the
 * JSON-LD block, meta tags, sitemap, robots.txt, and the JS data script).
 * The keys here are the single source of truth for what needs to be edited.
 */

window.SITE_CONFIG = {
  // Identity
  brand: "Your Rental Company",
  legalEntity: "Your Company Ltd.",
  tagline: "Chauffeur-Driven Car Rental & Airport Transfers",

  // URLs
  baseUrl: "https://example.com/",           // production origin (with trailing slash)
  ogImage: "https://example.com/assets/og-image.png",
  favicon: "/favicon.svg",

  // Locale
  language: "en",
  locale:   "en-US",
  currency: "USD",
  currencySymbol: "$",
  country:  "US",

  // Contact
  phone:      "+1 555 000 0000",             // human-readable
  phoneE164:  "+15550000000",                // ITU E.164
  whatsapp:   "15550000000",                 // digits only, no + (wa.me path)
  email:      "hello@example.com",

  // Address (must reflect a real business address before publishing)
  address: {
    street: "123 Example Street",
    city: "Your City",
    region: "Your Region",
    postalCode: "00000",
    country: "US"
  },
  geo: { lat: "0.0000", lng: "0.0000" },

  // Social profiles (only include real, publicly owned profiles)
  social: {
    instagram: "https://www.instagram.com/yourrentalcompany/",
    facebook: "",
    tiktok: "",
    youtube: ""
  },

  // Opening hours — 7-day array; fill with your real hours
  openingHours: [
    { day: "Monday",    opens: "00:00", closes: "23:59" },
    { day: "Tuesday",   opens: "00:00", closes: "23:59" },
    { day: "Wednesday", opens: "00:00", closes: "23:59" },
    { day: "Thursday",  opens: "00:00", closes: "23:59" },
    { day: "Friday",    opens: "00:00", closes: "23:59" },
    { day: "Saturday",  opens: "00:00", closes: "23:59" },
    { day: "Sunday",    opens: "00:00", closes: "23:59" }
  ],

  // Service areas — cities you actually serve
  areaServed: ["Your City", "Nearby City"],

  // Payments accepted
  paymentAccepted: ["Cash", "Credit Card", "Bank Transfer"],

  // Vehicle data (demo — replace with your real fleet)
  fleet: [
    // { name, pax, dailyInCity, dailyAllIn, type, slug, img }
    { name: "Compact MPV — Model A", pax: 7, dailyInCity: 50,  dailyAllIn: 125,  type: "MPV",       slug: "avanza",         img: "assets/armada/avanza.png" }
    // ... add more entries; see index.html vehicles array for full defaults.
  ],

  // Popular routes shown on the homepage / travel page
  routes: [
    // { from, to, dur, veh, price (number or null for "Contact us") }
    { from: "City B", to: "City F", dur: "~ 3 hours", veh: "Compact MPV", price: 125 }
  ],

  // Default SEO metadata (kept in sync with <head>)
  seo: {
    title: "Your Rental Company — Chauffeur-Driven Car Rental & Airport Transfers",
    description: "Chauffeur-driven car rental, airport transfers, and intercity travel in Your City. Transparent pricing, maintained fleet, and quick booking via WhatsApp.",
    themeColor: "#0B0F1A"
  }
};
