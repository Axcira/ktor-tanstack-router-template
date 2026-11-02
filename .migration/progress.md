# progress

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/progress.tsx` uses `@base-ui/react/progress` (`Track`, `Indicator`, `Label`, `Value`). No app route imports it.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

None.

## Verify by hand

If a screen renders Progress, confirm the bar fills with the value and does not rely on a manual scale transform.
