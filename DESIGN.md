# Design system (frontend)

Material Design 3–inspired **tokens only** — no MD3 components. The stack stays shadcn, Base UI, and Tailwind.

## Generated artifacts

| File | Tool | Hand-edit? |
| --- | --- | --- |
| `frontend/src/theme.generated.css` | `bun run --cwd frontend theme` | No |
| `frontend/src/styles.css` (pill radius, Tailwind `@theme` aliases) | Maintained in repo | Yes (aliases / pill only) |

`bun run frontend:check` runs Biome check and all custom UI/theme checks (`package.json`).

## Theme generator

From the repo root (after `bun install`):

```bash
bun run --cwd frontend theme --help
bun run frontend:theme
bun run --cwd frontend theme '#6750A4'
bun run --cwd frontend theme --variant=vibrant '#6750A4'
bun run --cwd frontend theme --success=#1b873f --info=#0277bd --warning=#f9a825
bun run --cwd frontend theme:check
```

### Defaults

Defaults are the constants in `frontend/scripts/theme.ts` (`DEFAULT_THEME`, `DEFAULT_RADIUS`, `DEFAULT_CONTRAST`). `package.json` does not duplicate them. `theme:check` runs the generator with only `--check`, so the committed CSS must match those constants. The header comment of `theme.generated.css` records every chosen option.

| Flag | Default | Role |
| --- | --- | --- |
| Primary (positional arg) | `#0061f3` | Brand / `primary` scheme (legacy template primary) |
| `--success=` | `#1b873f` | Success semantic palette |
| `--info=` | `#0277bd` | Info semantic palette |
| `--warning=` | `#f9a825` | Warning semantic palette |
| `--variant=` | `tonal-spot` | Every `Variant` exported by the installed `@material/material-color-utilities` (`tonal-spot`, `neutral`, `vibrant`, `expressive`, `fidelity`, `content`, `monochrome`, `rainbow`, `fruit-salad`, …). `--help` and unknown-variant errors list the installed set. |
| `--contrast=` | `0` | `DynamicScheme` `contrastLevel`, from `-1` to `1` |
| `--radius-sm=` | `0.375rem` | `--radius-sm` / `rounded-sm` |
| `--radius-md=` | `0.5rem` | `--radius-md` / `rounded-md` |
| `--radius-lg=` | `0.75rem` | `--radius-lg`, `--radius`, `rounded-lg` |
| `--radius-xl=` | `1.25rem` | `--radius-xl` / `rounded-xl` |

Radius lengths are `rem` or `px` (`0.25rem`, `4px`). `rounded-full` and `--radius-pill` (`9999px` in `styles.css`) are not flags.

Implementation: `@material/material-color-utilities` (`frontend/scripts/theme.ts`). Colors are written as **hex / rgba** (library ARGB output), not custom OKLCH conversion. Contrast is passed to the scheme constructor; this repo does not reimplement tone math.

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
| `--secondary` (+ foreground, container pair) | secondary container roles |
| `--tertiary` (+ foreground, container pair) | tertiary container roles |
| `--accent` (+ foreground) | same tertiary container roles |
| `--destructive` (+ container pair) | error roles |
| `--border`, `--outline*` | `outline` / `outline-variant`. `--border` is `outline-variant`. |
| `--input` | `surface-container-highest` |
| `--success` / `--info` / `--warning` (+ containers) | custom-color groups from their seeds |
| Sidebar `*` tokens | same roles on `surface-container-low` |
| `--chart-1` … `--chart-5` | primary, secondary, tertiary, containers |

`theme.generated.css` also publishes every scheme role from `MaterialDynamicColors.allColors`, plus `shadow`, `scrim`, `surface-tint`, and `surface-variant`. Palette key colors are not included. Each role is a Tailwind color prefixed with `md-` (`bg-md-primary`, `text-md-on-primary`, `bg-md-surface-container-low`). When `styles.css` does not already claim that name, the same role is available without the prefix (`bg-on-primary`, `bg-error`, `bg-surface-container-low`).

These short names stay shadcn aliases, so they are not the scheme role:

| Utility | Means | Scheme role |
| --- | --- | --- |
| `bg-secondary`, `text-secondary-foreground` | secondary container pair | `bg-md-secondary`, `text-on-secondary` |
| `bg-tertiary`, `text-tertiary-foreground` | tertiary container pair | `bg-md-tertiary`, `text-on-tertiary` |
| `bg-background` | `surface` | `bg-md-background` |

## Shape scale (corner radius)

`rounded-sm|md|lg|xl` read `--radius-*` from `frontend/src/theme.generated.css` (see the generator flags). Defaults, at a 16px root:

| Token / class | Default | ~Size | Use for |
| --- | --- | --- | --- |
| `--radius-sm` / `rounded-sm` | `0.375rem` | 6px | Checkbox, badge, tag, tooltip |
| `--radius-md` / `rounded-md` | `0.5rem` | 8px | Input, button, select, tabs, menu items |
| `--radius-lg` / `rounded-lg` | `0.75rem` | 12px | Card, popover, dropdown, toast (`--radius` aliases this) |
| `--radius-xl` / `rounded-xl` | `1.25rem` | 20px | Dialog, sheet, drawer, alert-dialog |
| `rounded-full` | fixed | pill | Avatar, chip, status badge (`--radius-pill: 9999px` in `styles.css`) |

Inner corners must use a **smaller** step than their container.

### Allowed Tailwind classes

Only `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`, `rounded-none`, plus directional variants (e.g. `rounded-t-lg`). No bare `rounded`, no `rounded-[…]`, no `rounded-2xl` / `3xl` / `4xl`.

Enforcement: `frontend/scripts/radius-check.ts` (part of `bun run frontend:check`). Changing a radius flag updates every `rounded-*` utility. The check still rejects arbitrary radii such as `rounded-[4px]`; pick a step on the scale instead of a one-off length.

## Tuning the look

To try colors or corner radii locally, pass flags to `bun run theme` from `frontend`. From the repo root, use `bun run --cwd frontend theme …`. `bun run theme --help` lists the flags. Color math stays in `@material/material-color-utilities`; this repo does not compute tones by hand.

Tried CSS differs from the defaults, so `bun run theme:check` fails. Restore the defaults with `bun run theme` and no flags. To adopt a look as the repo default, change `DEFAULT_THEME`, `DEFAULT_RADIUS`, and `DEFAULT_CONTRAST` in `frontend/scripts/theme.ts`, then regenerate with those same defaults. `package.json` does not copy the defaults. The header comment of the generated file records every flag from that run.

| Flag | Default | Effect |
| --- | --- | --- |
| Positional primary | `#0061f3` | Scheme seed. Not the primary color itself; the variant builds roles from this color |
| `--variant=` | `tonal-spot` | One of the variants below. Accepts every `Variant` from the installed library, and `--help` plus the error message list them |
| `--contrast=` | `0` | From `-1` (lowest) to `1` (highest). `0` is the spec default. Changes the strength of primary / on-primary and outline |
| `--success=` | `#1b873f` | Success seed |
| `--info=` | `#0277bd` | Info seed |
| `--warning=` | `#f9a825` | Warning seed |
| `--radius-sm=` | `0.375rem` | Checkbox, badge, tooltip (about 6px) |
| `--radius-md=` | `0.5rem` | Input, button, select (about 8px) |
| `--radius-lg=` | `0.75rem` | Card, popover, toast. `--radius` matches this (about 12px) |
| `--radius-xl=` | `1.25rem` | Dialog, sheet, drawer (about 20px) |

Radii are rem, such as `0.25rem`, or px, such as `4px`. `rounded-full` and `--radius-pill` (`9999px`) are fixed and have no flag.

### How variants look

Tendencies for the default primary `#0061f3` at contrast `0`.

| variant | Tendency |
| --- | --- |
| `tonal-spot` | Default. A neutral surface picks up the seed hue. With this seed, `--background` is `#faf8ff`, a faint blue-violet. Primary drops to `#4a5d92`, and contrast against white text looks weaker than the seed itself |
| `neutral` | Gray with almost no chroma. Background is `#fcf8fa`, and the blue-violet tint is nearly gone |
| `monochrome` | Grayscale. Background `#f9f9f9`, primary is black |
| `vibrant` | Raises the primary palette chroma as far as it goes |
| `expressive` | A more playful palette that deliberately leaves the seed hue |
| `fidelity` | Places the seed on the primary container and pulls primary toward the seed (`#004bc0` for this seed). Contrast against white is stronger than tonal-spot |
| `content` | Also places the seed on the primary container, like fidelity. This library version can produce colors that are almost the same as fidelity |
| `rainbow` | A playful palette. The seed hue does not appear in the theme |
| `fruit-salad` | Like rainbow, a playful palette that does not use the seed hue |

### Contrast

`--contrast` is `DynamicScheme`'s `contrastLevel`. Background color belongs to the variant, so tonal-spot's `#faf8ff` does not change when contrast moves. Role tones do.

- `0`: the current look. Primary `#4a5d92`, on-primary `#ffffff`, outline `#757680`, outline-variant `#c5c6d0`
- Toward `1`: primary gets darker (`#14295c`), on-primary stays white, and outline / outline-variant get darker. Contrast between text and surface goes up
- Toward `-1`: primary gets lighter (`#6073aa`), on-primary is no longer pure white, and outline gets lighter

To remove the blue-violet from the background, use `neutral` or `monochrome` rather than contrast. To bring primary back toward the seed blue and raise contrast, use `fidelity` (and raise contrast a little if needed).

### Corner radius

Values are written to `:root` in `theme.generated.css` and flow to every `rounded-sm` / `md` / `lg` / `xl` through `@theme` in `styles.css`. Do not change the class names. `radius:check` looks only at class names, not at the numbers.

Example that moves toward the old sharper corners (more neutral, higher contrast, smaller radii):

```bash
bun run theme --variant=neutral --contrast=0.5 \
  --radius-sm=0.125rem --radius-md=0.25rem \
  --radius-lg=0.375rem --radius-xl=0.5rem
```

px works the same way: `--radius-sm=2px --radius-md=4px --radius-lg=6px --radius-xl=8px`

### Text input background

The input component (`frontend/src/components/ui/input.tsx`) uses `bg-input/50`. The color token is `--input` (Tailwind's `--color-input`), painted at 50% opacity over the surface underneath.

- Light: `--input` is MD3 `surface-container-highest` (`#e3e2e9` by default). `--border` and `--outline-variant` are `#c5c6d0`. At 50% over `#faf8ff`, the gray fill is visible
- Dark: `--input` is the same role (`#33343a` by default)

Raising contrast darkens `surface-container-highest`, so this gray stands out more. To make it lighter, do not raise contrast; drop the hue with `neutral` / `monochrome`, or change Input's `bg-input/50` to `bg-transparent` or a lower opacity. The latter is a component class, not a flag.

## UI coding rules

- Use semantic color classes: `bg-background`, `text-primary`, `border-border`, `bg-primary-container`, `text-success`, etc.
- `frontend/src/components/ui/` is shadcn code owned by this project. Edit it directly so components follow these rules (semantic tokens, the shape scale). It is not generated output to leave untouched. Biome ignores that directory.
- Do **not** use raw Tailwind palette utilities (`bg-gray-100`, `text-red-500`, …) or hard-coded hex in app code.
- Prefer `frontend/src/lib/theme-tokens.ts` for repeated patterns (form errors, toasts, role badges).
- Use `ResponsiveSelect` (`frontend/src/components/ResponsiveSelect.tsx`) for every dropdown in app routes and feature components — not raw `<select>` and not direct imports from `@/components/ui/select`. Native `<select>` on coarse pointers, shadcn Select on fine pointers. Pass Base UI Select root props (`value`, `defaultValue`, `onValueChange`, `name`, `required`, `disabled`, `form`, `autoComplete`, and the open props). `value` and `onValueChange` use `string | null` because Base UI clears the value with `null`. `id`, `className`, `aria-*`, and `data-*` are forwarded to both the native control and the shadcn trigger. Popup-only props (`open`, `defaultOpen`, `onOpenChange`) apply on fine pointers and are ignored on the native control. Branch overrides are `triggerProps`, `contentProps`, and `nativeProps`.

Enforcement: `frontend/scripts/select-check.ts` (part of `bun run frontend:check`).

- A control that navigates is `ButtonLink` (`frontend/src/components/ui/button.tsx`), not `<Button render={<Link>}>` or `<Button render={<a>}>`. Base UI's button sets `role="button"` when `nativeButton` is false, so a link rendered that way is announced as a button. `ButtonLink` is the router `Link` with `buttonVariants`, and it stays an anchor. Enforcement: `frontend/scripts/button-link-check.ts` (part of `bun run frontend:check`).

### Semantic status colors (`success`, `info`, `warning`)

| Location | Usage |
| --- | --- |
| `lib/theme-tokens.ts` | `roleBadgeClass` (Editor → info, Writer → warning containers); `notificationToastClass` (success/info/error inline banners) |
| `Header.tsx` | User menu role chip (`bg-info-container`) |
| `UsersTable.tsx` | Role badges via `roleBadgeClass` |
| `permissions/roles/index.tsx` | Copy-role notification banner via `notificationToastClass` |
| Showcase upload | Upload stats (`text-success`, `text-info`) and completed-row icon |
| Showcase form | Success state hero icon (`text-success`) |
| Showcase dashboard | Reference badges, status banners, and toast buttons (default / success / info / warning / error) |

Toast (`frontend/src/components/ui/toast.tsx`) paints each toast with `toastSurfaceClass` from `theme-tokens.ts`. The classes follow the app theme because they use semantic tokens. Description text is `text-current`, so it stays on the container foreground. A type other than the four below, including `loading`, uses the default surface. The corner radius is `rounded-lg`.

| Type | Classes |
| --- | --- |
| default | `border-border bg-surface-container text-foreground` |
| `success` | `border-success bg-success-container text-success-container-foreground` |
| `info` | `border-info bg-info-container text-info-container-foreground` |
| `warning` | `border-warning bg-warning-container text-warning-container-foreground` |
| `error` | `border-destructive bg-destructive-container text-destructive-container-foreground` |

The viewport is bottom-centered below the `sm` breakpoint and bottom-right from `sm`. It uses `z-[100]` so a toast opened from a dialog or sheet stays above that layer (`z-50`).
