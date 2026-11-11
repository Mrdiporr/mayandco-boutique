# Deploying MAY & CO. to Vercel (browsing-only)

The Lovable-hosted site (https://mayandco-boutique.lovable.app) is the default. Vercel is optional.

This setup is for a browsing-only launch. Do not add a private service key to Vercel for this setup.

## How it works
- `vercel.json` runs `bun run build:vercel`.
- On Vercel (`VERCEL` env is set automatically) `vite.config.ts` switches the server preset to `vercel`, producing `.vercel/output`.
- Inside Lovable the build always targets Lovable hosting, so this never affects the preview or live site.

The Vercel project has not been deployed from this workspace because no Vercel account/project connection is available. The sandbox also pins its own hosting output during local builds, so a successful sandbox build does not confirm that `.vercel/output` was generated. Verify the deployment after importing the repository into Vercel.

## Steps
1. Connect the project to GitHub from Lovable (Connectors > GitHub).
2. In Vercel: Add New > Project > import the repo. Leave Framework Preset as "Other"; vercel.json supplies the commands.
3. In Vercel Project Settings > Environment Variables, add these public storefront settings for Production and Preview, using the matching values from the project's Lovable Cloud configuration:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `SUPABASE_URL` (same value as `VITE_SUPABASE_URL`)
   - `SUPABASE_PUBLISHABLE_KEY` (same value as `VITE_SUPABASE_PUBLISHABLE_KEY`)
4. Deploy, then add a custom domain under Project > Settings > Domains.

## What works and what does not
Public storefront pages, catalogue browsing, and search use the publishable key. Personal shopper request submission can work when its existing public database policy is available.

The following are unavailable on this browsing-only deployment because they require privileged server access:
- order creation and checkout
- admin dashboard actions that read or change private store data
- admin image uploads
- product and catalogue image delivery through `/api/public/media/...`

An admin-only key must never be used as a Vercel environment variable for this browsing-only setup. To enable checkout, uploads, and image delivery on Vercel, first move those operations to a backend you control and configure its private credentials securely there.
