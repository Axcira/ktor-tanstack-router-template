# collapsible

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/collapsible.tsx` uses `@base-ui/react/collapsible`. Content is `Panel`.

`CollapsibleMenuItems.tsx` and `AppSidebarItem.tsx` pass `render` instead of `asChild`. Chevron classes use `group-data-open/collapsible`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

Open state is `data-open` on the root, not `data-state=open`.

## Verify by hand

Expand a sidebar group with children. The chevron should rotate, and the submenu should show and hide. Repeat with the keyboard.
