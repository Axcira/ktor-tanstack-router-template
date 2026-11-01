# dropdown-menu

2026-11-01, golden pair via three-way merge onto the base-luma registry, migrated

## Changed

`frontend/src/components/ui/dropdown-menu.tsx` uses `@base-ui/react/menu`. Content is Positioner > Popup. Submenu defaults stay `align="start"`, `alignOffset={-3}`, `side="right"`, `sideOffset={0}`. Menu radius stays `rounded-lg`; items stay `rounded-md`. `cn-menu-*` and `cn-rtl-flip` hooks this project had removed stay removed. Indicators are Lucide checks.

`Header.tsx` and `showcase/table.tsx` open the menu with `render`.

Leftover scan: `grep -n "radix-ui\|@radix-ui"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

Checkbox and radio items do not close the menu on click (`closeOnClick` defaults to false). Not forced on. Submenu triggers also use `data-popup-open`.

## Verify by hand

Open the header menu and the showcase table row menu. Arrow through items, typeahead a label, and confirm a plain item closes the menu while a checkbox item would not.
