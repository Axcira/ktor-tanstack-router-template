# popover

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/popover.tsx` uses `@base-ui/react/popover` with Positioner (`isolate z-50`) and Popup. Radius stays `rounded-lg`.

`PopoverMenuItems.tsx` and `AppSidebarItem.tsx` pass `render` instead of `asChild`. There is no Popover Anchor in this project.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

Popover Anchor has no Base UI equivalent. It was unused, so nothing was stubbed.

## Verify by hand

Collapse the sidebar and open a parent item. The popover should sit to the right of the icon and close on Escape.
