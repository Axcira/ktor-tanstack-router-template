# tabs

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/tabs.tsx` uses `@base-ui/react/tabs`. Trigger is `Tab`, content is `Panel`. Radius stays `rounded-md`. The base `aria-disabled` classes are included. No app route imports Tabs.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

Activation stays manual (Base UI default). `activationMode="manual"` is not a prop. `activateOnFocus` was not added.

## Verify by hand

If a screen renders Tabs, click a tab and confirm the panel changes. Arrow to another tab and confirm it does not activate until Enter or click.
