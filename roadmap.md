# Roadmap

- [x] Re-close image-link security finding
- [x] Order tracking page (/track) + admin status stages and customer notes
- [x] Paystack checkout, webhook and return page (code complete)
- [ ] Paystack live test — blocked: saved key was rejected by Paystack as invalid; re-enter secret key
- [ ] Add webhook URL in Paystack dashboard: https://mayandco-boutique.lovable.app/api/public/paystack-webhook (after publish)
- [ ] Publish the new checkout and tracking
- [ ] Deploy browsing-only Vercel site — blocked: Vercel project is not connected; import the repository and apply `docs/deploy/vercel.md` settings
- [x] Validate checkout on the server and atomically reserve in-stock quantities; automatically record sold-out/overflow quantities as pre-orders
