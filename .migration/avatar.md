# avatar

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/avatar.tsx` imports `@base-ui/react/avatar`. Markup and radius (`rounded-full`) are unchanged.

`frontend/src/components/layout/header/Header.tsx` puts the avatar in `DropdownMenuTrigger` via `render`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

None.

## Verify by hand

Open the header account menu from the avatar. Image fallback initials should still show, and the menu should open on click and Escape.
