# dialog

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/dialog.tsx` uses `@base-ui/react/dialog`. Overlay is Backdrop, content is Popup (no Positioner). Close uses `render` on a ghost icon button with Lucide `XIcon`. Radius stays `rounded-xl`. Title uses `font-heading`.

Showcase modals and article/permission dialogs open through `render`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

None patched. Focus return follows Base UI defaults.

## Verify by hand

Open the showcase edit dialog and a delete dialog. Tab through controls, close with Escape and the X button, and confirm focus returns to the trigger.
