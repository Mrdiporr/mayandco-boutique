# Publish latest updates + prepare for Vercel

## 1. Publish to the live site
- Run a fresh security check first and tell you about any critical issues.
- Publish to https://mayandco-boutique.lovable.app. This ships search, sorting, the low-stock alerts, the upload checks and the image-link fix.

## 2. Prepare a Vercel version (kept separate from the Lovable build)
The site is currently built for Lovable's hosting. Vercel needs a different server output, so the Vercel setup only kicks in when the site is built on Vercel. The Lovable preview and the live site keep working as they do now.

- Add a `vercel.json` with the build command and framework set to "Other". Vercel will build with the Vercel output target.
- Add a `build:vercel` script that selects the Vercel target. Vite then writes the `.vercel/output` folder that Vercel serves.
- Add `docs/deploy/vercel.md` with step-by-step instructions:
  - connect the GitHub repo to Vercel
  - add the backend settings it needs: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY and the VITE_* values
  - a caveat: the private service key isn't available on Lovable Cloud. On Vercel, checkout, the admin uploads and the image links need that key, so they won't work without it.
  - connect a custom domain
- Add a rule to AGENTS.md: Lovable hosting stays the default build target, and Vercel is opt-in through its own build command.
- Check that the normal build still passes. Run the Vercel build locally and check that it produces `.vercel/output`.

## Technical details
- `vite.config.ts`: pass a nitro preset override only when `process.env.VERCEL` (or `DEPLOY_TARGET=vercel`) is set, using the `defineConfig` passthrough so plugins aren't duplicated.
- Publish happens first. The Vercel files don't change how the Lovable build behaves.
