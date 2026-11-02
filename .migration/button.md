# button

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/button.tsx` now renders `@base-ui/react/button` instead of a Slot/`asChild` branch. `data-variant` and `data-size` stay. Radius stays `rounded-md`, and the secondary hover stays `hover:bg-secondary/80`.

Call sites that passed `asChild` now pass `render` (buttons, menu triggers, dialogs, sheets, popovers, tooltips, collapsible triggers, and sidebar menu buttons). `DrawerTrigger` in `frontend/src/routes/_app/showcase/modals.tsx` still uses `asChild` because the drawer stays on vaul.

`ResponsiveSelect` pins values to `string | null`, passes `items` so the trigger shows the option label, and drops `dir`. Call sites that used `setState` wrap a null value before writing a string. `RoleForm` no longer passes `type="button"` to `Switch`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

None inside the button itself. Call sites replace `asChild` with `render`.

## Verify by hand

Open any page with a link-styled button (article list "記事を書く", hero "ログイン"). Keyboard-focus it, activate it, and confirm it navigates and keeps the button styles.
