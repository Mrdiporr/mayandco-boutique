# MAY & CO. — Admin Dashboard, WhatsApp Checkout & Catalogue Upgrade

This turns the storefront from hardcoded demo data into a real, self-managed shop: a secure admin dashboard backed by Lovable Cloud, a transfer-only + WhatsApp checkout, a personal shopper request form, and an accessible 3D catalogue.

## 1. Backend (Lovable Cloud)

Enable Lovable Cloud (database, auth, file storage). Tables:

- `products` — name, slug, price, category, description, details, active, sort order, `is_new`
- `product_images` — many per product, with position for reordering
- `product_variants` — size + stock integer per product (drives the existing pre-order logic)
- `categories` — name, slug, position
- `catalogue_items` — the 3D gallery entries: image, title, tag, note, position (reorderable)
- `orders` + `order_items` — customer details, items, totals, payment method, status (`pending`, `awaiting_transfer`, `paid`, `cancelled`)
- `shopper_requests` — personal shopper submissions from /catalogue
- `store_settings` — WhatsApp number, bank transfer details (bank name, account name, account number), announcement text
- `user_roles` + `has_role()` — admin role in a separate table (never on profiles), security definer function

Public site reads active products/catalogue anonymously. Orders and requests are insert-only for the public; only admins can read/update them. All existing hardcoded product data is migrated in as seed rows so the site looks identical on day one.

## 2. Admin dashboard (`/admin`)

Email + password login at `/admin/login`, admin role checked server-side. Sections:

- **Dashboard** — today's orders, revenue, pending transfers, new shopper requests
- **Products** — create/edit/delete, price, category, description, details bullets, per-size stock, active toggle, multi-image upload with drag-to-reorder and cover selection
- **Categories** — add/rename/delete/reorder
- **Orders** — list + detail view; see items, sizes, customer info, and mark as Paid / Cancelled; one-click "Open in WhatsApp" with the order pre-filled
- **Shopper requests** — same treatment for /catalogue submissions
- **Catalogue curation** — upload catalogue images, edit title/tag/note, drag to reorder, hide/show — the 3D gallery reads live from this, no redeploy needed
- **Settings** — WhatsApp number, bank transfer details, so nothing is hardcoded

Images go to Cloud storage, so uploads are instant and permanent.

## 3. Logo

Recommendation: crop and clean, not regenerate. The current file is a photo of a printed sticker — blurred desk background around a blush disc, slightly soft edges. The wordmark itself (the serif MAY & CO with the infinity loop) is genuinely good and already your brand; regenerating would risk losing it.

Plan: crop tight to the disc, isolate the wordmark onto a transparent background, and clean the edges. Ship two variants — a dark wordmark for the cream header/footer and a light/inverted one for dark sections — plus keep the blush circle version as the favicon and social avatar.

## 4. Checkout — transfer + WhatsApp only

Card payment and the simulated Paystack modal are removed. New flow:

1. **Bag review** → shipping details form (name, phone, email, address, city, state), zod-validated.
2. **Choose how to finish**, two options:
   - **Bank Transfer** — order saved to the dashboard as `awaiting_transfer`, then the account details and exact amount are shown with a copy button and a clear "no payment on delivery" notice, plus a "Send proof on WhatsApp" button that opens WhatsApp with the order reference and itemised summary pre-filled.
   - **Continue on WhatsApp** — order saved as `pending`, then straight to WhatsApp with the full bag, sizes, totals and customer details pre-filled so you finish the conversation there.
3. **Confirmation screen** — order reference, itemised breakdown, downloadable receipt, and next-step instructions. Cart clears only after the order is saved.

Both paths always write the order to the admin dashboard first, so nothing is lost if the customer never opens WhatsApp.

## 5. Personal shopper request form on /catalogue

Selecting pieces in the 3D gallery adds them to a request tray (sticky bar showing count). The form collects name, phone/WhatsApp, preferred sizes per selected piece, budget range, colour notes and a free-text brief. On submit it saves to `shopper_requests` and opens WhatsApp with a formatted summary. Validated client and server side, with length limits and proper URL encoding.

## 6. Catalogue accessibility & 3D polish

- Cards become a proper roving-focus grid: arrow keys move between pieces, Enter/Space opens the detail sheet, Escape closes it, focus returns to the originating card.
- Visible focus rings on every card and control; the detail sheet becomes a focus-trapped dialog with an accessible title and a real close button.
- `prefers-reduced-motion`: pointer tilt, parallax depth and hover scale all disabled, replaced by simple opacity fades.
- Tap targets raised to a minimum 44px on all controls; select/request buttons get their own hit areas rather than the whole card being one giant button.
- Pointer tilt only activates for fine pointers (skipped on touch), and images get explicit dimensions to stop layout shift.

## Technical notes

- Data access via TanStack Start server functions; admin routes live under an `_authenticated` gate with a server-side role check, never a client-side flag.
- Every new public table gets explicit GRANTs plus RLS policies scoped to `authenticated`/`anon` as appropriate.
- Store settings (WhatsApp number `+234 814 884 0440`, placeholder bank details you edit in the dashboard) are seeded, not hardcoded in components.
- Storefront routes read live data with `ensureQueryData` in the loader and `useSuspenseQuery` in components, keeping SSR and SEO metadata intact.
