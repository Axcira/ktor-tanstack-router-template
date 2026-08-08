# frontend

TanStack Router + React + Vite SPA for this monorepo.

## Commands

Prefer root workspace scripts (from the repository root after `bun install`):

```bash
bun run frontend:dev      # Vite on :3000 (proxies /api → :8080)
bun run frontend:build
bun run frontend:test
bun run frontend:check
```

Or from this directory:

```bash
bun run dev
bun run build
bun run test
bun run check
```

## Notes

- Path alias: `@/*` → `./src/*`
- Generated (do not edit): `src/routeTree.gen.ts`, `src/api/generated/`
- API client: regenerate via root `bun run generate:client` (see `.agents/skills/regenerate-api-client/SKILL.md`)
- Cloudflare Workers Static Assets: `bun run cf:dev` / `bun run cf:deploy`

See the repository root [README.md](../README.md) and [AGENTS.md](../AGENTS.md) for full setup.
