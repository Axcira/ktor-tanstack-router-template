# Design system (frontend)

Material Design 3–inspired **tokens only** — no MD3 components. The stack stays shadcn, Radix, and Tailwind.

## Generated artifacts

| File | Tool | Hand-edit? |
| --- | --- | --- |
| `frontend/src/theme.generated.css` | `bun run --cwd frontend theme` | No |
| `frontend/src/styles.css` (shape tokens) | Maintained in repo | Yes (shape only) |

`bun run frontend:check` runs `theme:check`, `radius:check`, and `select:check`.

## Theme generator

From the repo root (after `bun install`):

```bash
bun run frontend:theme
bun run --cwd frontend theme '#6750A4'
bun run --cwd frontend theme --variant=vibrant '#6750A4'
bun run --cwd frontend theme --success=#1b873f --info=#0277bd --warning=#f9a825
bun run --cwd frontend theme:check
```

### Defaults

| Seed | Default hex | Role |
| --- | --- | --- |
| Primary (positional arg) | `#0061f3` | Brand / `primary` scheme (legacy template primary) |
| `--success=` | `#1b873f` | Success semantic palette |
| `--info=` | `#0277bd` | Info semantic palette |
| `--warning=` | `#f9a825` | Warning semantic palette |
| `--variant=` | `tonal-spot` | MD3 dynamic scheme style |

Implementation: `@material/material-color-utilities` (`frontend/scripts/theme.ts`). Colors are written as **hex / rgba** (library ARGB output), not custom OKLCH conversion.

Each semantic seed is harmonized toward the primary source via MD3 `customColor(..., blend: true)` and exposes `--success`, `--success-foreground`, `--success-container`, `--success-container-foreground` (and the same pattern for `info` and `warning`).

Preview scopes for the settings theme picker:

- `.theme-preview-light` — same variables as `:root`, `color-scheme: light`, and **`background-color: var(--background)`**
- `.theme-preview-dark` — same variables as `.dark`, `color-scheme: dark`, and **`background-color: var(--background)`**

The preview mock sits on a card (`bg-card`). Resetting custom properties is not enough: a preview with no background is transparent, so the card’s color shows through. In a dark app that makes the light preview look black even when its `--background` / `--muted` variables are already the light values. Dark previews looked correct because they also had the `bg-background` utility. Both scopes now paint their own background in generated CSS, and the settings markup uses `bg-background` on every preview pane.

Tailwind `dark:` utilities are scoped in `frontend/src/styles.css` so they follow the app theme **except** inside `.theme-preview-light` (light preview stays light when the app is dark). `.theme-preview-dark` is treated as a dark context when the app is light. That variant scope does not paint the preview surface; the background declarations above do.

## Color token mapping (MD3 → app)

| App / shadcn token | MD3 role |
| --- | --- |
| `--background`, `--foreground` | `surface`, `on-surface` |
| `--card`, `--popover`, `--muted` | surface container steps |
| `--primary`, `--primary-foreground` | `primary`, `on-primary` |
| `--primary-container`, `--on-primary-container` | primary container roles |
| `--secondary`, `--accent` | secondary / tertiary containers |
| `--destructive` (+ container pair) | error roles |
| `--border`, `--input`, `--outline*` | outline / outline-variant |
| `--success` / `--info` / `--warning` (+ containers) | custom-color groups from their seeds |
| Sidebar `*` tokens | same roles on `surface-container-low` |
| `--chart-1` … `--chart-5` | primary, secondary, tertiary, containers |

## Shape scale (corner radius)

Defined in `frontend/src/styles.css`:

| Token / class | ~Size | Use for |
| --- | --- | --- |
| `--radius-sm` / `rounded-sm` | 6px | Checkbox, badge, tag, tooltip |
| `--radius-md` / `rounded-md` | 8px | Input, button, select, tabs, menu items |
| `--radius-lg` / `rounded-lg` | 12px | Card, popover, dropdown, toast |
| `--radius-xl` / `rounded-xl` | 20px | Dialog, sheet, drawer, alert-dialog |
| `rounded-full` | pill | Avatar, chip, status badge |

Inner corners must use a **smaller** step than their container.

### Allowed Tailwind classes

Only `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`, `rounded-none`, plus directional variants (e.g. `rounded-t-lg`). No bare `rounded`, no `rounded-[…]`, no `rounded-2xl` / `3xl` / `4xl`.

Enforcement: `frontend/scripts/radius-check.ts` (part of `bun run frontend:check`).

## UI coding rules

- Use semantic color classes: `bg-background`, `text-primary`, `border-border`, `bg-primary-container`, `text-success`, etc.
- `frontend/src/components/ui/` is shadcn code owned by this project. Edit it directly so components follow these rules (semantic tokens, the shape scale). It is not generated output to leave untouched. Biome ignores that directory.
- Do **not** use raw Tailwind palette utilities (`bg-gray-100`, `text-red-500`, …) or hard-coded hex in app code.
- Prefer `frontend/src/lib/theme-tokens.ts` for repeated patterns (form errors, toasts, role badges).
- Use `ResponsiveSelect` (`frontend/src/components/ResponsiveSelect.tsx`) for every dropdown in app routes and feature components — not raw `<select>` and not direct imports from `@/components/ui/select`. Native `<select>` on coarse pointers, shadcn Select on fine pointers. Pass Radix Select root props (`value`, `defaultValue`, `onValueChange`, `name`, `required`, `disabled`, `form`, `autoComplete`, and the open/dir props). `id`, `className`, `aria-*`, and `data-*` are forwarded to both the native control and the shadcn trigger. Radix-only props (`open`, `defaultOpen`, `onOpenChange`, `dir`, …) apply on fine pointers and are ignored on the native control. Branch overrides are `triggerProps`, `contentProps`, and `nativeProps`.

Enforcement: `frontend/scripts/select-check.ts` (part of `bun run frontend:check`).

### Semantic status colors (`success`, `info`, `warning`)

| Location | Usage |
| --- | --- |
| `lib/theme-tokens.ts` | `roleBadgeClass` (Editor → info, Writer → warning containers); `notificationToastClass` (success/info/error inline banners) |
| `Header.tsx` | User menu role chip (`bg-info-container`) |
| `UsersTable.tsx` | Role badges via `roleBadgeClass` |
| `permissions/roles/index.tsx` | Copy-role notification banner via `notificationToastClass` |
| Showcase upload | Upload stats (`text-success`, `text-info`) and completed-row icon |
| Showcase form | Success state hero icon (`text-success`) |
| Showcase dashboard | Reference badges, status banners, and Sonner buttons (default / success / info / warning / error) |

Sonner (`frontend/src/components/ui/sonner.tsx`) follows the app theme from `themeAtom` and sets toaster CSS variables from `sonnerToastCssVars` in `theme-tokens.ts`:

| Sonner variable | App token |
| --- | --- |
| `--normal-bg` / `--normal-text` / `--normal-border` | `--surface-container`, `--foreground`, `--border` |
| `--success-*` | `--success-container`, `--success-container-foreground`, `--success` |
| `--info-*` | `--info-container`, `--info-container-foreground`, `--info` |
| `--warning-*` | `--warning-container`, `--warning-container-foreground`, `--warning` |
| `--error-*` | `--destructive-container`, `--destructive-container-foreground`, `--destructive` |

`richColors` stays on so those variables paint typed toasts. Description text uses `!text-current` so Sonner’s hardcoded description color does not override the token.
