<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Lovable hosting (nitro default target) stays the default build; Vercel is opt-in via `build:vercel` / `VERCEL` env switching the nitro preset in vite.config.ts — keeps the Lovable preview and live site unaffected.
- Order payment status may only become paid via a Paystack verify call (webhook or return page) that matches the server-computed total — never from client input.
- Order status/event writes and public order lookups go through server functions with the service role; `order_status_events` and `order_lookup_attempts` have no client write grants.
