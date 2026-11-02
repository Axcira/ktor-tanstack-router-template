# radio-group

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/radio-group.tsx` imports `@base-ui/react/radio-group` and `@base-ui/react/radio`. Item is `Radio.Root`. Field-label focus classes this project had removed stay removed. No app route imports it.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

None beyond the part rename.

## Verify by hand

If a screen renders the group, arrow-key between items and confirm only one is checked.
