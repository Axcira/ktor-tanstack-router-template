# sidebar

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/sidebar.tsx` uses `useRender` for group label, group action, menu button, menu action, and submenu button. The menu button tooltip wraps `render` on `TooltipTrigger`. Floating and inset radius stay `rounded-lg`. The trigger icon is Lucide `PanelLeftIcon` without `cn-rtl-flip`. Imports point at `@/components/ui/*` and `@/hooks/useMobile.ts`.

Sidebar call sites in `AppSidebarItem.tsx`, `AppSidebarFooter.tsx`, `CollapsibleMenuItems.tsx`, and `PopoverMenuItems.tsx` pass `render` instead of `asChild`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

Sidebar `data-state` is still `expanded` or `collapsed` from this component, not a Radix open state. Menu-button composition uses `render`.

## Verify by hand

Collapse and expand the sidebar with the header button and with Ctrl/Cmd+B. On a narrow viewport the mobile sheet should open. A linked item should navigate. A tooltip should show when collapsed.
