# badge

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/badge.tsx` uses `useRender` and `mergeProps`. `data-slot="badge"` and `data-variant` still come from render state. Radius stays `rounded-sm`.

No app call site passed `asChild` to Badge.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

None.

## Verify by hand

On the showcase table, confirm status badges still show the right color and size.
