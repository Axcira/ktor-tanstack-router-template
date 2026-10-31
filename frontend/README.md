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
- Generated (do not edit): `src/routeTree.gen.ts`, `src/api/generated/`, `src/theme.generated.css`
- **Design tokens (MD3):** Color roles are generated from a seed hex via Material Color Utilities. See [Design tokens](#design-tokens) below.
- API client: regenerate via root `bun run generate:client` (see `.agents/skills/regenerate-api-client/SKILL.md`)
- Cloudflare Workers Static Assets: `bun run cf:dev` / `bun run cf:deploy`

See the repository root [README.md](../README.md) and [AGENTS.md](../AGENTS.md) for full setup.

## Design tokens

Semantic colors live in `src/theme.generated.css` (light `:root` and `.dark`). Shape tokens are in `src/styles.css` (`--radius-sm` … `--radius-xl`, `--radius-pill`).

### Shape scale (corner radius)

| Token / class | Size | Use for |
| --- | --- | --- |
| `--radius-sm` / `rounded-sm` | ~6px | Checkbox, badge, tag, tooltip |
| `--radius-md` / `rounded-md` | ~8px | Input, button, select, tabs, menu items |
| `--radius-lg` / `rounded-lg` | ~12px | Card, popover, dropdown, toast (`--radius` base) |
| `--radius-xl` / `rounded-xl` | ~20px | Dialog, sheet, drawer, alert-dialog |
| `--radius-pill` / `rounded-full` | pill | Avatar, chip, status badge when roundness is semantic |

Inner corners must use a **smaller** step than their container. App code may only use `rounded-sm|md|lg|xl|full|none` (plus directional variants like `rounded-t-lg`). `bun run radius:check` enforces this (also runs in `bun run check`).

### Regenerate theme

From this directory (or `bun run --cwd frontend theme` from the repo root):

```bash
bun run theme              # default seed: legacy primary oklch(0.541 0.235 259.6) → #0061f3
bun run theme '#6750A4'    # custom seed hex
bun run theme --variant=vibrant '#6750A4'
bun run theme:check        # CI: fail if generated CSS is stale
```

Commit `theme.generated.css` after changing the seed. `bun run check` runs `theme:check` automatically.

### Rules for UI code

- Use semantic Tailwind classes backed by CSS variables: `bg-background`, `text-primary`, `border-border`, `bg-primary-container`, `text-success`, etc.
- Do **not** use raw Tailwind palette utilities (`bg-gray-100`, `text-red-500`, …) or hard-coded hex/rgb in app code.
- Prefer shared helpers in `src/lib/theme-tokens.ts` for repeated patterns (form errors, toasts, role badges).
- Corner radius: follow the [shape scale](#shape-scale-corner-radius)—no `rounded-2xl`/`3xl`/`4xl`, bare `rounded`, or `rounded-[…]`.

### MD3 → shadcn mapping (summary)

| App token | MD3 role |
| --- | --- |
| `--background`, `--foreground` | `surface`, `on-surface` |
| `--card`, `--popover`, `--muted` | surface container steps |
| `--primary`, `--primary-foreground` | `primary`, `on-primary` |
| `--primary-container`, `--on-primary-container` | primary container roles |
| `--secondary`, `--accent` | secondary / tertiary containers |
| `--destructive` (+ container pair) | error roles |
| `--border`, `--input`, `--outline*` | outline / outline-variant |
| `--success`, `--info`, `--warning` | tertiary / secondary aliases for status UI |
| Sidebar `*` tokens | same roles on surface-container-low |
