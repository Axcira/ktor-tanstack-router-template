# drawer

2026-11-01, golden pair via the base-luma registry, migrated off Vaul

## Changed

`frontend/src/components/ui/drawer.tsx` now imports `@base-ui/react/drawer`. The registry anatomy is Viewport, Popup, and Content, with Backdrop for the overlay. `cn` comes from `@/lib/utils`. Title uses `font-heading`. Popup radius is `rounded-xl` so it stays on this project's shape scale (`rounded-4xl` and `rounded-[inherit]` from the registry do not).

`frontend/src/routes/_app/showcase/modals.tsx` opens the drawer with `render` instead of `asChild`.

`vaul` is removed from `frontend/package.json`.

Leftover scan: `grep -n "radix-ui\|@radix-ui\|vaul"` on this component's files is clean.

## Left alone

`frontend/src/components/ui/sonner.tsx` and `frontend/src/components/ui/chart.tsx` stay on Sonner and Recharts.

## Behavior changes

`showSwipeHandle` defaults to false, so the bottom grabber is not rendered unless a caller opts in. Swipe-to-dismiss defaults to `down`. Overlay fade follows `data-starting-style` and `data-ending-style`, not Vaul's `data-state`.

## Verify by hand

Open the showcase status drawer. Confirm it slides up, the status menu stays open long enough to pick another option, and Escape or a press on the backdrop closes the drawer.
