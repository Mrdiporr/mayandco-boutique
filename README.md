# May & Co. Boutique

# Project Overview
Build a premium, high-conversion, agency-grade e-commerce storefront for "@mayandco.ng" (instagram), a luxury street fashion and contemporary female apparel retail brand based in Nigeria. The website must feel like an editorial lookbook mixed with an elite streetwear boutique (similar to Cult Gaia or SSENSE).

## Visual Style & Aesthetics
- **Theme:** High-end minimalist boutique, clean typography, editorial grid layout, and luxury fashion energy.
- **Palette:** Deep Charcoal/Jet Black (#111111) for high-contrast primary elements, Soft Cream/Alabaster (#FDFBF7) for background warmth, and subtle Soft Amber (#D4AF37) for premium accents. White and neutral grays for structural borders.
- **Typography:** Serif or bold Display fonts for luxury editorial headers; clean, hyper-readable Sans-Serif (e.g., Inter or Helvetica Neue) for body, pricing, and interface buttons.
- **Micro-interactions:** Smooth hover scales on product cards, fade-in transitions for page navigations, and crisp slide-out animations for drawers.

## Navigation & Architecture
Implement a global top-navigation bar (sticky on scroll) with links to:
1. Shop All (Dropdown submenus: Clothing, Accessories)
2. New Arrivals
3. Pre-Order Hub
4. Cart Icon (Opens a slide-out cart drawer)

Implement a comprehensive clean footer with:
- Store Policy links (Shipping, Exchange Policy, Strict "No Payment on Delivery" guidelines)
- Legal Disclaimer text box.

## Core Features & Atomic Components

### 1. Hero Landing Page Section
- Immersive split screen or large full-width banner container designed to house a video loop or high-res lookbook imagery.
- Clear bold typography: "MAY & CO. — CURATED FEMALE APPAREL."
- High-contrast Call to Action (CTA) button: "Explore New Drops".

### 2. Live Dynamic Product Grid & Product Detail Pages
- Display items using real catalog examples as default data placeholders:
  * Leopard Mesh Set — ₦39,000
  * Halter Neck Puff Dress — ₦41,500
  * Pleated Polka Dot Dress — ₦42,000
  * Patchwork Denim Trousers — ₦45,500
  * Miu Miu Curated Cap — ₦25,000
- Product detail pages must feature a variant selector dropdown or radio grid for Sizes: S, M, L, XL, XXL.

### 3. Dynamic Automated Pre-Order Toggle Logic
- Each product variant must track an in-stock integer count.
- If inventory > 0: Show a solid Black CTA button labeled **"Add to Cart (Next Day Dispatch)"**.
- If inventory == 0: The CTA button must automatically transition to a Soft Amber outline CTA button labeled **"Pre-Order (Fulfills in 2–3 Weeks)"**.
- Include an inline tooltip/text notification on the product card clarifying the pre-order fulfillment timeline if triggered.

### 4. Zero-POD (Payment on Delivery) Frictionless Checkout Flow
- The checkout step must explicitly restrict cash/payment on delivery.
- Build a checkout UI simulating an automated payment processing modal (simulating a Paystack/Flutterwave integration flow).
- Provide options for "Card Payment" and "Instant Bank Transfer".
- Include a simulated 10-second verification spinner when "Pay via Bank Transfer" is chosen, resulting in a clean "Order Confirmed & Paid" state screen with a downloadable breakdown receipt.

### 5. Mandatory Global Legal Disclaimer
- Place a persistent, elegant disclaimer block in the site footer: 
  *"Mayandco.ng is an independent retailer. Brand names, logos, and trademarks displayed remain the sole property of their respective owners and are utilized strictly for product descriptive purposes."*

## Technical & State Requirements
- Ensure flawless, mobile-first responsive layouts using Tailwind CSS classes. All grids must drop to a single or dual column on mobile screens.
- Build robust empty states for the Cart Drawer ("Your bag is empty. Explore our new arrivals!") and search filters.
- Build clean loading states (shimmer/skeleton effects) for product images.
 

Future updates: Embed Snapchat post/page and TikTok.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mayandco-boutique.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2fc35a22-c8de-4423-9bf4-67def2ee412b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
