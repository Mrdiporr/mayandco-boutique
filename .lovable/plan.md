# MAY & CO. — Luxury Storefront

An editorial, high-conversion storefront for @mayandco.ng: charcoal/cream/amber palette, serif display headers, sans-serif interface type, and boutique-grade micro-interactions. All catalog and checkout behavior runs on in-app data — no backend needed for this build.

## Design system

- Palette: Jet Black `#111111`, Alabaster `#FDFBF7`, Soft Amber `#D4AF37`, neutral gray borders — added as semantic tokens (background, foreground, primary, accent, muted, border) in `src/styles.css`.
- Type: editorial serif display (e.g. Playfair Display / Instrument Serif) for headers, Inter for body, pricing and buttons — loaded via `<link>` in the root route.
- Motion: hover scale + image cross-fade on product cards, fade-in page transitions, slide-out drawer, skeleton shimmer on images.

## Pages & navigation

Sticky top nav: Shop All (dropdown: Clothing, Accessories), New Arrivals, Pre-Order Hub, cart icon with item count opening the slide-out drawer. Mobile: full-screen slide-in menu.

Routes:
- `/` — hero banner (full-width, video-loop-ready container), "MAY & CO. — CURATED FEMALE APPAREL.", "Explore New Drops" CTA, featured grid, editorial section.
- `/shop` — full grid with category + size + availability filters, empty-filter state.
- `/shop/$slug` — product detail: gallery, size radio grid (S–XXL), stock-aware CTA, description, policy accordions.
- `/new-arrivals` — newest drops grid.
- `/pre-order` — Pre-Order Hub with sold-out-but-orderable items and timeline explainer.
- `/checkout` — Zero-POD checkout flow.
- Policy pages: `/shipping`, `/exchange-policy`, `/payment-policy`.

Footer on every page: policy links, socials (Instagram now; Snapchat/TikTok slots reserved), and the mandatory legal disclaimer block verbatim.

## Catalog

Seed catalog with the five real items (Leopard Mesh Set ₦39,000; Halter Neck Puff Dress ₦41,500; Pleated Polka Dot Dress ₦42,000; Patchwork Denim Trousers ₦45,500; Miu Miu Curated Cap ₦25,000) plus a few extras to fill the grid. Each product has category, tags, and per-size stock integers — some sizes deliberately at 0 to demo pre-order. Product imagery generated as editorial fashion shots.

## Pre-order logic

Per selected variant:
- stock > 0 → solid black CTA "Add to Cart (Next Day Dispatch)".
- stock == 0 → amber outline CTA "Pre-Order (Fulfills in 2–3 Weeks)" plus inline note on both the card and the detail page explaining the fulfillment timeline.
Cart lines carry a pre-order flag and display it in the drawer and order summary.

## Zero-POD checkout

1. Bag review + shipping details form (validated).
2. Explicit notice: no payment on delivery accepted; payment required to confirm.
3. Payment method choice — Card Payment or Instant Bank Transfer, in a Paystack-style processing modal.
4. Bank Transfer path shows account details and a 10-second verification spinner with progress copy.
5. Success screen: "Order Confirmed & Paid", order reference, itemized breakdown, and a downloadable receipt (generated client-side).

## Technical notes

- Cart state in a React context with localStorage persistence; drawer empty state: "Your bag is empty. Explore our new arrivals!"
- Mobile-first: grids collapse to 1–2 columns; sticky mobile add-to-cart bar on product pages.
- Skeleton shimmer wrapper for all product images until load.
- Each route defines its own `head()` metadata (title, description, og/twitter) for SEO.
- Naira formatting helper via `Intl.NumberFormat('en-NG')`.
- Snapchat/TikTok embeds are left as clearly marked footer slots for the future update.
