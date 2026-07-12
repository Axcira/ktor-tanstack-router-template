---
name: deploy-frontend
description: Use when deploying the frontend application to Cloudflare Workers Static Assets
---

# deploy-frontend

Deploy the frontend SPA to Cloudflare Workers using Wrangler Static Assets.
This skill covers the full pipeline: frozen dependency install, lint/format
check, production build, Wrangler dry-run, and (after explicit confirmation)
the live deploy.

## Scope

- Install frontend dependencies with `--frozen-lockfile`
- Run `bun run check` (Biome lint + format check — reports violations, does not auto-format)
- Run `bun run build` (Vite production build)
- Run `wrangler deploy --dry-run` to preview
- Deploy with `bun run cf:deploy` (== `bun run build && wrangler deploy`)
- Does **not** configure Cloudflare authentication, create Workers, or set up
  custom domains — those are prerequisites the user must satisfy beforehand.

## Prerequisites

1. **Cloudflare account** — a free Workers plan is sufficient.
2. **Wrangler authenticated** — use `bunx wrangler login` (interactive OAuth)
   or set `CLOUDFLARE_API_TOKEN` environment variable.  Verify with
   `bunx wrangler whoami`.  Refer to Wrangler's own output for
   account-selection and token-scope guidance.
3. **Bun** (package manager) — see `../../../frontend/package.json`.

## Steps

1. **Authenticate with Cloudflare (if needed)**

   ```bash
   bunx wrangler login
   ```

   This opens a browser window.  Complete the OAuth flow.  Verify with:

   ```bash
   bunx wrangler whoami
   ```

   The skill stops here if authentication fails.

2. **Frozen dependency install**

   ```bash
   cd frontend
   bun install --frozen-lockfile
   ```

   This reproduces the exact dependency tree from `bun.lock`.  Failures here
   typically indicate lockfile drift — resolve intentional drift by running
   `bun install` and committing the updated lockfile separately.

3. **Lint and format check**

   ```bash
   bun run check
   ```

   Biome runs lint rules and checks formatting.  Fix violations before
   proceeding.

4. **Production build**

   ```bash
   bun run build
   ```

   Output goes to `frontend/dist/`.  The build must exit zero — resolve any
   TypeScript/Vite errors before deploying.

5. **Wrangler dry-run (preview deploy)**

   Continue from `frontend/` (entered in step 2):

   ```bash
   bunx wrangler deploy --dry-run
   ```

   This prints what Wrangler **would** upload without actually deploying.
   Inspect the file list and asset sizes.  If the dry-run shows unexpected
   files, check your `dist/` contents and `wrangler.jsonc` assets config.

6. **User confirmation**

   ```
   ?  Ready to deploy to Cloudflare Workers?  (y/N)
   ```

   The skill **must** pause and require explicit keyboard confirmation.
   Default is No.  The skill aborts without making any live changes if the
   response is anything other than an affirmative `y` or `yes`.

7. **Live deploy**

   ```bash
   bun run cf:deploy
   ```

   This runs `bun run build` again (idempotent — safe to rebuild) then
   `wrangler deploy`.  On success Wrangler prints the Worker URL.

## Confirmation / destructive boundaries

- **Dry-run is mandatory** — never skip the `--dry-run` step.
- **Explicit user confirmation** required before any live deploy.
- The skill never invents credentials, creates Workers, or modifies
  Cloudflare configuration (routes, domains, env vars).
- If confirmation is denied, the skill exits cleanly with no changes.

## Verification

- Confirm Wrangler output shows `Uploaded` / `Published` with the expected
  Worker name (from `wrangler.jsonc`).
- Visit the deployed URL and verify the SPA loads correctly (including SPA
  fallback for non-root paths).
- Optionally run `bunx wrangler versions list` to inspect the active version.

## Safe failure

| Failure | Behaviour |
|---------|-----------|
| `bun install --frozen-lockfile` fails | Lockfile out of date — run `bun install` and commit new lockfile |
| `bun run check` fails | Fix Biome violations; re-run |
| `bun run build` fails | Fix TS / Vite errors; re-run |
| `wrangler deploy --dry-run` fails | Wrangler misconfigured or auth expired — re-authenticate |
| User declines confirmation | Clean exit, no live changes |
| `bun run cf:deploy` fails | Check Wrangler auth and network; inspect error output |

## See also

- [`AGENTS.md`](../../../AGENTS.md) — Dev startup order and frontend scripts
- [`frontend/wrangler.jsonc`](../../../frontend/wrangler.jsonc) — Wrangler config
