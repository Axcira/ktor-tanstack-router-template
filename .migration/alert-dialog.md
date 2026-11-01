# alert-dialog

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/alert-dialog.tsx` uses `@base-ui/react/alert-dialog`. Action and Cancel render a `Button` via `render` rather than `asChild`. Radius stays `rounded-xl`. Title uses `font-heading`.

`AppSidebarFooter.tsx` updates its content animation hooks to `data-open` / `data-closed` and opens the dialog with `render`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

Cancel is `Close`. Action is a button rendered inside the dialog, matching the base registry.

## Verify by hand

From the sidebar, choose logout. Cancel should return focus to the trigger without logging out. Confirm should log out.
