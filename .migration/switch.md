# switch

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/switch.tsx` uses `@base-ui/react/switch`. Custom track size (`h-[18.4px] w-8` / `h-3.5 w-6`) and thumb travel stay.

`frontend/src/routes/_app/permissions/roles/-components/RoleForm.tsx` drops `type="button"`. `RoleForm.test.tsx` queries `[role="switch"]`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

The switch renders a `<span role="switch">`, not a `<button>`, so `type` is invalid. It does not submit a form. Flagged, not patched back into a button.

## Verify by hand

On role create, toggle a permission and the allow-others switch. Submit and confirm the payload. Tab to the switch and toggle it with Space.
