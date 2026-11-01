# checkbox

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/checkbox.tsx` uses `@base-ui/react/checkbox` and a Lucide `CheckIcon`. Radius stays `rounded-sm`. The field-label focus classes that this project had already removed stay removed.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

The root renders a non-button element. `disabled:` classes remain as in the base registry.

## Verify by hand

In a form that uses Checkbox, toggle it with mouse and Space. Confirm the check icon and the form value.
