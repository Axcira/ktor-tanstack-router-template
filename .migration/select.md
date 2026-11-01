# select

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/select.tsx` re-exports `SelectPrimitive.Root`. Popup positioning uses `alignItemWithTrigger` (default true). Trigger radius stays `rounded-md` with `border-outline`. Popup radius stays `rounded-lg`, including this project's side translate. Icons are Lucide.

`frontend/src/components/ResponsiveSelect.tsx` passes `items` so the closed trigger shows the option label, types the value as `string | null`, and no longer accepts `dir`. `ResponsiveSelect.test.tsx` chooses an option instead of a hidden `<select>`. Role, user, and showcase call sites ignore a null value before storing a string.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

Select no longer accepts `dir` or `position="popper"`. Direction belongs on a Direction provider. `onValueChange` may receive `null`. The closed trigger shows the item label only when `items` is set; ResponsiveSelect sets it.

## Verify by hand

On the user list, change the role filter. The trigger should show the label, not the raw id. On a coarse pointer the native select should still change the same state.
