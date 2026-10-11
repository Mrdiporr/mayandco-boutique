# Intended public RLS policies

The security scanner flagged five permissive (`USING true` / `WITH CHECK true`) policies. Each was reviewed with the store owner and confirmed intentional. Regression test: `bun test ./tests/rls.test.ts` (calls the API as an anonymous visitor; each run leaves one shopper request named "[rls-test] …" in Admin > Requests, which can be deleted).

| # | Table | Policy | Access | Why it is intended |
|---|-------|--------|--------|--------------------|
| 1 | `product_variants` | Variants are public | anon/auth SELECT | Storefront and PDP need stock per size to choose "Add to Cart (Next Day Dispatch)" vs "Pre-Order", and to show low-stock badges in the PDP and cart drawer. Only size + stock count; no sensitive data. |
| 2 | `categories` | Categories are public | anon/auth SELECT | Header "Shop All" dropdown and `/shop` filtering. Public catalogue taxonomy. |
| 3 | `store_settings` | Store settings are public | anon/auth SELECT | Checkout must show the transfer bank details, WhatsApp number, shipping fee and Instagram handle to guests. This data is meant to be shown to every buyer. Single row. |
| 4 | `product_images` | Product images are public | anon/auth SELECT | PDP galleries for anonymous shoppers. Image URLs only. |
| 5 | `shopper_requests` | Anyone can submit a request | anon/auth INSERT | Personal-shopper form on `/catalogue` works without an account. Insert-only: guests cannot read, update or delete requests; only admins can. |

## Invariants the test enforces
- Anon can read 1–4 and insert into 5.
- Anon **cannot** read `shopper_requests`, update `store_settings`, insert `categories`, or insert/read `orders` (orders are written only by the server-side `placeOrder` with the service role).

If any of these change, the test fails — re-review the policy before updating the test.
