# Deploying MAY & CO. to Vercel

The Lovable-hosted site (https://mayandco-boutique.lovable.app) is the default. Vercel is optional.

## How it works
- `vercel.json` runs `bun run build:vercel`.
- On Vercel (`VERCEL` env is set automatically) `vite.config.ts` switches the server preset to `vercel`, producing `.vercel/output`.
- Inside Lovable the build always targets Lovable hosting, so this never affects the preview or live site.

## Steps
1. Connect the project to GitHub from Lovable (Connectors > GitHub).
2. In Vercel: Add New > Project > import the repo. Leave Framework Preset as "Other"; vercel.json supplies the commands.
3. Environment variables (Production + Preview):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (copy from `.env`)
   - `SUPABASE_URL` (same as VITE_SUPABASE_URL)
   - `SUPABASE_PUBLISHABLE_KEY` (same as VITE_SUPABASE_PUBLISHABLE_KEY)
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy, then add a custom domain under Project > Settings > Domains.

## Important limitation
The private service key (`SUPABASE_SERVICE_ROLE_KEY`) is not available on Lovable Cloud. Without it, on Vercel these will fail:
- placing orders at checkout
- admin image uploads
- product/catalogue image links (`/api/public/media/...`)

Browsing, search, the catalogue and the shopper request form work with the publishable key alone. For a fully working Vercel deploy you would need a backend you control and can obtain that key for.
