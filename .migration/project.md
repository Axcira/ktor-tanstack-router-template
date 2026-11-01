# project

2026-11-01, whole-project golden pair (base-luma), migrated

## Changed

Style in `frontend/components.json` is `base-luma`. `@base-ui/react@1.9.0` is a dependency. `radix-ui` is removed.

Nineteen wrappers were merged from the base-luma registry onto this project's radius scale, Lucide icons, `@/lib/utils` `cn` import, and `font-heading`. App call sites that used `asChild` now use `render`, except the vaul drawer.

`bun run frontend:typecheck` passes. `bun run radius:check` and `bun run select:check` pass. Biome check passes. Frontend unit tests pass except `frontend/scripts/theme.test.ts`, which already expected `--input: #c5c6d0` while the theme generator emits `--input: #e3e2e9`. That failure is pre-existing on this branch; this migration does not touch the theme generator. `bun run theme:check` also reports `theme.generated.css` out of date for the same pre-existing drift.

## Left alone

`frontend/src/components/ui/drawer.tsx` (vaul), `frontend/src/components/ui/sonner.tsx`, and `frontend/src/components/ui/chart.tsx` (recharts) are not Radix wrappers. `card`, `input`, `textarea`, `table`, and `skeleton` do not import Radix.

## Behavior changes

See each component report. Notable flags: tabs stay manual; menu checkbox and radio items do not close on click; switch is not a native button; select value changes may be null; tooltip delay prop is `delay`.

## Verify by hand

Log in, then walk the sidebar, header menu, article links, role-permission switches, user role filter, and the showcase modals page. Confirm focus returns from dialogs and the mobile sidebar opens.
