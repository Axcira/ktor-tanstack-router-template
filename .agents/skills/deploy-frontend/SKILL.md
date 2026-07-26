---
name: deploy-frontend
description: Use when deploying the frontend — production mockups use mockup-deploy CLI (SPA bundled in Ktor); Workers path is legacy/optional
---

# deploy-frontend

## Preferred path (mockup production)

Mockup production no longer uses Cloudflare Workers. The Vite SPA is
built into the backend image and served by Ktor at `/` (Scalar is
disabled when `/app/static/index.html` is present).

Use the personal CLI at `~/Projects/mockup-deploy`:

```bash
mockup-deploy deploy <path-or-slug>
```

That pipeline: image build/push → remote compose → Cloudflare Tunnel
hostname → smoke checks.

Do **not** create Workers, GitHub Cloudflare integrations, or Tunnel
Host-header rewrites for new mockups.

## Legacy / optional: Cloudflare Workers Static Assets

Only use this when the user explicitly asks to deploy the SPA to Workers
(e.g. a standalone static preview). This skill then covers: frozen
dependency install, lint/format check, production build, Wrangler
dry-run, and (after explicit confirmation) the live deploy.

### Scope (Workers only)

- Install frontend dependencies with `--frozen-lockfile`
- Run `bun run check` (Biome lint + format check — reports violations, does not auto-format)
- Run `bun run build` (Vite production build)
- Run `wrangler deploy --dry-run` to preview
- Deploy with `bun run cf:deploy` (== `bun run build && wrangler deploy`)
- Does **not** configure Cloudflare authentication, create Workers, or set up
  custom domains — those are prerequisites the user must satisfy beforehand.

### Prerequisites (Workers only)

1. **Cloudflare account** — a free Workers plan is sufficient.
2. **Wrangler authenticated** — use `bunx wrangler login` (interactive OAuth)
   or set `CLOUDFLARE_API_TOKEN` environment variable.  Verify with
   `bunx wrangler whoami`.
3. **Bun** (package manager) — see `../../../frontend/package.json`.

### Steps (Workers only)

1. Authenticate with Cloudflare if needed (`bunx wrangler login` / `whoami`).
2. `cd frontend && bun install --frozen-lockfile`
3. `bun run check`
4. `bun run build`
5. `bunx wrangler deploy --dry-run`
6. Ask for explicit confirmation before live deploy (default No).
7. `bun run cf:deploy`

### Confirmation / destructive boundaries

- **Dry-run is mandatory** — never skip the `--dry-run` step.
- **Explicit user confirmation** required before any live deploy.
- The skill never invents credentials, creates Workers, or modifies
  Cloudflare configuration (routes, domains, env vars) unless asked.

## See also

- [`AGENTS.md`](../../../AGENTS.md) — SPA-from-Ktor production mode
- [`backend/Dockerfile`](../../../backend/Dockerfile) — root-context image build
- `~/Projects/mockup-deploy` — personal deploy CLI
