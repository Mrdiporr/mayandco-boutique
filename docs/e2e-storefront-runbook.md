# MAY & CO — End-to-End QA Runbook (Admin → Storefront → Admin)

**Purpose:** a manual, repeatable check that a product can be created in the studio, appear on the website, be bought by a customer, and be accepted and tracked through delivery.
**Duration:** about 25–35 minutes. **Run it:** before every publish, after any checkout/payment change, and monthly.

---

## 0. Before you start

| Item | Value |
|---|---|
| Live site | https://mayandco-boutique.lovable.app |
| Studio login | `/auth` → `admin@mayandcoboutique.com` (your own password) |
| Test devices | 1 laptop browser (admin) + 1 phone or private/incognito window (customer) |
| Test card (Stripe test mode only) | `4242 4242 4242 4242`, any future date, any CVC |
| Bank transfer shown at checkout | OPay · May and Co Boutique · 8148840440 |

**Naming rule — keeps real sales figures clean:** everything created in this run starts with `[QA-TEST]`.
- Product name: `[QA-TEST] Velvet Corset` · slug: `qa-test-velvet-corset`
- Customer name: `[QA-TEST] Ada Buyer` · phone: `08000000001` · email: `qa@mayandcoboutique.com`

**Record sheet** (fill in as you go):

| Field | Value |
|---|---|
| Date / tester | |
| Order reference (MC-…) | |
| Payment method tested | Transfer / Card |
| Result | PASS / FAIL |

> Rule: if any step's **Expected** doesn't match, stop, mark FAIL, write the step number and a screenshot, then continue to Section 7 cleanup.

---

## 1. Admin — sign in

| # | Action | Expected |
|---|---|---|
| 1.1 | Open `/admin` while signed out | Redirected to the sign-in page |
| 1.2 | Sign in with the studio email | Studio dashboard opens with tabs: Orders, Products, Catalogue, Categories, Requests, Settings |
| 1.3 | Open **Settings** | Bank name, account name, account number, WhatsApp number and shipping fee are correct; card payment shows "test mode" or "live" as intended |

## 2. Admin — create and publish the product

| # | Action | Expected |
|---|---|---|
| 2.1 | Products → **New product** | Empty product form opens |
| 2.2 | Name `[QA-TEST] Velvet Corset`, slug `qa-test-velvet-corset`, price `48000`, any category, short description, upload one JPG/PNG photo | Photo preview appears; no error |
| 2.3 | Stock: **S = 1**, **M = 5**, **L = 0**, XL = 0, XXL = 0 | Values accepted |
| 2.4 | Tick **Active** (and "New" if wanted) → **Save** | Success message; product listed in Products |
| 2.5 | Negative check: try slug `QA Test!` | Rejected — lowercase letters, numbers and dashes only |
| 2.6 | Negative check: try uploading a `.pdf` or `.txt` renamed to `.jpg` | Upload refused (only real images allowed) |

## 3. Storefront — find the product (customer window)

| # | Action | Expected |
|---|---|---|
| 3.1 | Open `/shop` (no sign-in) | Product card visible with photo and **₦48,000** — no redeploy needed |
| 3.2 | Type `velvet` in the shop search | List narrows; count reads e.g. "1 piece matching 'velvet'"; × clears it |
| 3.3 | Header magnifier → search `corset` | Lands on `/shop` with query filled in |
| 3.4 | Sort Price: Low → High, then High → Low | Order changes correctly |
| 3.5 | Open the product page | Photo, price, description, size guide shown |
| 3.6 | Select **S** | Gold note: "Only 1 left in size S…"; button "Add to Cart (Next Day Dispatch)" |
| 3.7 | Select **M** | No urgency note; "Add to Cart (Next Day Dispatch)" |
| 3.8 | Select **L** | Amber "Pre-Order (Fulfills in 2–3 Weeks)" |

## 4. Storefront — bag and checkout

| # | Action | Expected |
|---|---|---|
| 4.1 | Select **M**, add to bag | Bag drawer slides open with the item, size M, qty 1 |
| 4.2 | Raise quantity to 6 | Warning that only 5 are in stock — lower quantity or pre-order the rest |
| 4.3 | Back to qty 1 → **Checkout** | Subtotal ₦48,000 + shipping fee from Settings = correct total |
| 4.4 | Confirm notices | "No payment on delivery" banner visible |
| 4.5 | Enter the `[QA-TEST]` customer details and a Lagos address | Form accepts; required fields flagged if empty |

**Path A — Bank transfer**

| # | Action | Expected |
|---|---|---|
| 4.A1 | Choose bank transfer → place order | Confirmation with reference **MC-XXXXXXXX**, OPay details and exact total |
| 4.A2 | Tap WhatsApp button | WhatsApp opens with order breakdown pre-written (don't need to send) |
| 4.A3 | Download receipt | Receipt shows reference, item, size, total |

**Path B — Card (only while Stripe is in test mode)**

| # | Action | Expected |
|---|---|---|
| 4.B1 | Choose card → Pay now | Stripe payment page shows the same total in NGN |
| 4.B2 | Pay with `4242 4242 4242 4242` | Returned to store; "Payment confirmed" with reference |
| 4.B3 | Click Back on the Stripe page instead (separate run) | Return to checkout; order stays unpaid |

Write the reference in the record sheet.

## 5. Admin — accept and fulfil the order

| # | Action | Expected |
|---|---|---|
| 5.1 | Orders tab → refresh | New order at top with customer, item, size M, total, payment method |
| 5.2 | Status shown | Transfer: **pending payment**. Card: already **paid** (set automatically) |
| 5.3 | Transfer only: set **Paid** → save | Status updates |
| 5.4 | Set **Processing** → save | Status updates |
| 5.5 | Set **Shipped**, customer note "GIG Logistics – waybill QA123" → save | Status + note saved |
| 5.6 | Set **Delivered** → save | Status updates |

## 6. Customer — track the order

Do 6.1 after step 5.2, and repeat 6.2 after each status change in Section 5.

| # | Action | Expected |
|---|---|---|
| 6.1 | Open `/track`, enter reference + `08000000001` | Timeline shows **Received** (or Paid for card) |
| 6.2 | Re-check after each admin change | Received → Paid → Processing → Shipped (with courier note) → Delivered, each dated |
| 6.3 | Same reference, phone `+234 800 000 0001` | Still found (phone formats match) |
| 6.4 | Same reference, wrong phone | "Not found" — no order details leaked |
| 6.5 | Several wrong attempts quickly | Lookups get blocked for a while |

## 7. Cleanup (always do this)

| # | Action | Expected |
|---|---|---|
| 7.1 | Set the test order to **Cancelled**, admin note "QA run – not a sale" | Hidden from real fulfilment work |
| 7.2 | Product → untick Active (or Delete) | Gone from `/shop` and search within a refresh |
| 7.3 | Requests tab → delete any `[QA-TEST]` / `[rls-test]` requests | Removed |
| 7.4 | Card runs: in Stripe test dashboard, note the test payment (no refund needed) | — |

## 8. Edge cases & safety checks (optional, run monthly)

| # | Scenario | Expected |
|---|---|---|
| 8.1 | Buy the last size S, then try to buy S again in another window | Second buyer sees pre-order, not next-day dispatch |
| 8.2 | Change price in admin while a customer has it in their bag | Checkout charges the **new** server price, never the bag's old number |
| 8.3 | Signed out, open `/admin` | Redirected to sign-in |
| 8.4 | Signed in as a non-admin account | Dashboard refuses access |
| 8.5 | Card page closed before returning to the store | Order stays unpaid; admin can mark Paid manually after checking Stripe |
| 8.6 | Settings → turn off bank transfer | Checkout shows card only |

## 9. Sign-off

- [ ] Sections 1–7 all PASS
- [ ] Cleanup done
- [ ] Failures logged with step number + screenshot

**Status reference:** pending payment / awaiting WhatsApp → shows "Received"; paid → "Paid"; processing; shipped; delivered/fulfilled → "Delivered"; cancelled → marked cancelled.
