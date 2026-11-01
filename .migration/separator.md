# separator

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/separator.tsx` uses `@base-ui/react/separator`. The `decorative` prop is gone. Orientation classes use `data-horizontal` / `data-vertical`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

`decorative` is no longer accepted. Nothing in the app passed it.

## Verify by hand

Open a menu or the sidebar and confirm separators are still a hairline.
