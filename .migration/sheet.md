# sheet

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/sheet.tsx` uses `@base-ui/react/dialog`. Overlay fade uses `data-starting-style` / `data-ending-style`. This project's `backdrop-blur-sm` stays. Close uses `render` and Lucide `XIcon`. Title uses `font-heading`.

`frontend/src/routes/_app/showcase/modals.tsx` opens the sheet with `render`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

Overlay animation follows the base registry (transition opacity) rather than `animate-in` keyframes.

## Verify by hand

Open the showcase side panel. It should slide from the right, trap focus, and close from the X button, overlay, and Escape.
