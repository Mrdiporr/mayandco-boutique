# Prepare the browsing-only Vercel deployment

## Plan
- Validate the existing Vercel-target build and confirm it produces the deployment output Vercel expects.
- Update the Vercel deployment instructions for a browsing-only launch, using only public configuration and clearly identifying checkout, admin uploads, and product image delivery as unavailable without a separate private backend.
- Confirm the deployment handoff. A Vercel account/project is not connected in this workspace, so the final Vercel publish must wait until the project is imported into the user's Vercel account.

## Technical details
- Preserve Lovable as the default hosting target; Vercel remains opt-in.
- Do not add or expose private keys. Use the existing Vercel build target and the project's public storefront configuration.
