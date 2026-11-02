# tooltip

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/tooltip.tsx` uses `@base-ui/react/tooltip` with `Portal` > `Positioner` (`isolate z-50`) > `Popup`. Provider delay is the `delay` prop (default 0). Content radius stays `rounded-sm`. The arrow uses the base per-side offsets and `rounded-sm` instead of `rounded-[2px]`.

`AppSidebarFooter.tsx` nests tooltip and alert-dialog triggers with `render`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

Public prop `delayDuration` is now `delay`. Nothing passed `delayDuration`. `disableHoverableContent` has no equivalent and was unused.

## Verify by hand

Collapse the sidebar and hover the logout icon. The tooltip should appear immediately (delay 0) and dismiss on blur.
