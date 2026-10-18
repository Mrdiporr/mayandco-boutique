# Automatic payments and customer order tracking

## 1. Automatic payment confirmation (Paystack)
Paystack is the most common card and transfer gateway in Nigeria, and it supports naira. Payments confirm themselves, so you no longer need to check WhatsApp for proof of payment.

- At checkout, add **Pay now (card, bank transfer, USSD)**. It opens Paystack's secure payment window for the exact order total.
- When Paystack confirms the payment, the order turns **Paid** in /admin automatically. The customer sees an "Order confirmed and paid" page with their receipt.
- Two checks keep this safe:
  - The order total is always calculated on our side, never taken from the customer's browser.
  - Paystack's confirmation is accepted only after its signature and the exact amount have been checked.
- Manual transfer plus WhatsApp stays available as a backup. You can switch it off in Settings.
- The no-payment-on-delivery rule stays.
- **Needed from you:** your Paystack **secret key**. You'll find it in your Paystack dashboard under Settings > API Keys. I'll ask for it securely when we build this, and start with the test key.

## 2. Customer order lookup and status updates
- Add a new **Track Order** page (`/track`), with a link in the header and footer. The customer enters their order reference (e.g. MC-MVEGN0JU) and the phone number used at checkout.
- They see a timeline with these stages: **Received → Paid → Processing → Shipped → Delivered**. Cancelled shows separately.
  - Each stage shows its date.
  - Pre-order items get a note: "Fulfills in 2–3 weeks".
  - If you add a courier or tracking note in /admin, it appears on the timeline.
- In /admin you move each order through these stages. Every change is saved with its time.
- The confirmation page and receipt show a "Track your order" link.
- Customers only ever see their own order. Lookup needs both the reference and the matching phone number, and too many wrong attempts are blocked for a while.

## Technical details
- Database migration:
  - add the statuses `processing`, `shipped` and `delivered` to the existing set
  - new table `order_status_events (order_id, status, note, created_at)`; only admins can read it, through RLS, and the server writes to it
  - new columns on `orders`: `paystack_reference`, `paid_at`, `tracking_note`
  - new setting `enable_manual_transfer` in `store_settings`
- `createPaystackPayment` server function: creates the order using the existing `placeOrder` logic, then calls Paystack's transaction-initialize endpoint with the amount in kobo and returns the payment link.
- New `/api/public/paystack-webhook` endpoint:
  - checks the `x-paystack-signature` header (HMAC-SHA512 of the raw request body) using the Web Crypto API, which works on the edge runtime
  - re-verifies the payment via Paystack's verify endpoint and confirms the amount matches the order total
  - marks the order paid only once, even if Paystack sends the same event twice, and logs the event
- New `/checkout/callback` route: verifies the payment's reference on the server, then shows the confirmation.
- `trackOrder` server function (public, Zod-validated):
  - looks the order up with the service role using both the reference and the phone number, normalised before matching
  - returns only the stages, dates and item names; no address or email
- Admin's `updateOrder`: supports the new statuses and tracking note, and logs each status change.
- Add regression tests for the signature check, the amount check and the tracking lookup.
- Add an AGENTS.md rule: payment status may only change through a verified webhook or verify call.
