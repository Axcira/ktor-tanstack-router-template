# AGENTS.md

Operating rules for agents in this monorepo. Human setup lives in [README.md](README.md).

Backend is Ktor on JDK 25 (Exposed, HikariCP, Flyway). Frontend is a TanStack Router + React + Vite SPA in a root Bun workspace. Use `bun` (never npm, pnpm, or yarn). See root and workspace `package.json` for scripts.

## Do not hand-edit

- `frontend/src/routeTree.gen.ts` — TanStack Router Vite plugin
- `frontend/src/api/generated/` — Orval (`bun run generate:client`)
- `backend/generated/openapi.json` — `generateOpenApiJson`
- `frontend/src/theme.generated.css` — `bun run frontend:theme`

Commit generated files. CI runs `bun run orval:drift` and fails on drift.

`frontend/src/components/ui/` IS hand-edited (project-owned shadcn code). Follow [DESIGN.md](DESIGN.md) and format edits by hand because Biome ignores that directory.

## Backend

Each feature is a vertical slice under `backend/src/main/kotlin/net/axcira/features/<name>/`:
- `<Name>Service.kt` + request/response types
- `v1/<Name>Routing.kt` exposing `fun Application.<name>()`

Wire new features in `Application.kt` (`provide<XService>()` in `dependencies`) and `src/main/resources/application.yaml` (`ktor.application.modules`).
- `apiRouting("/articles")` mounts `/api/v1/articles`. Add a KDoc with `OperationID:` on each route (becomes the Orval hook name).
- Keep Kotlin and Ktor catalog versions in sync; mismatches break OpenAPI `operationId` inference.
- Tables live in `net.axcira.db`. Generate migrations via `cd backend && ./gradlew generateMigrations` and review the SQL for destructive statements before committing.
- Auth is cookie-based (`user_session`, 7d TTL in DB). No public signup; admins manage users (`ManageUsers`, UI at `/permissions/users`). `ApplicationInitializer` seeds admin unless `SKIP_BOOTSTRAP=true`. Outside development, `ADMIN_PASSWORD` and `SECRET` (Argon2 pepper) are required.
- Permission logic lives in `Permission.satisfies` (`Administrator` bypasses all; `ManageArticles` implies article perms; `UpdateArticle`/`DeleteArticle` carry `allowOthers`). Clients may shortcut type-only permissions locally and call `can-i` for compound checks — do not reimplement the algebra in TypeScript.
- Validation lives in `plugins/RequestValidation.kt` (`400 { message, reasons }`). Health is `GET /api/v1/health`, deploy identity is `GET /api/v1/version`.
- Tests use `test { }` from `BaseTest.kt` (shared Ktor app, Testcontainers `postgres:18.4` migrated once, `TRUNCATE ... RESTART IDENTITY CASCADE` between tests, fresh client per test, fast Argon2 + `SKIP_LOGIN_MIN_WAIT=true`).
- Keep `ktor-server-test-host` on `codegen` and `test` classpaths only, never `main`.

## Frontend

- `@/*` maps to `./src/*`.
- Authenticated routes live under `src/routes/_app/` (redirects to `/` when signed out; `/` and `/login` redirect to `/dashboard` when signed in). Colocate route-specific components in sibling `-components/` folders. Add sidebar links in `src/components/layout/sidebar/MenuItems.tsx`.
- Use the generated client (`@/api/generated/`), Jotai theme state (`src/store/theme.ts`), and `useAuthorize` (`src/hooks/useAuthorize.ts`).
- Match density and patterns in `src/routes/_app/showcase/`.
- Follow [DESIGN.md](DESIGN.md) for color/shape tokens and UI rules.
- Use Dialog, AlertDialog, or Toast (`@/components/ui/toast`) — never `window.alert` or `window.confirm`.
- Tests (Vitest + Testing Library + MSW in `src/test/`) cover session shortcuts and `can-i` UI reactions; leave permission matrices to backend tests.

## Environment

- Ktor reads process env vars directly (does not load `.env`). See [`.env.example`](.env.example) for all variables and defaults.
- Without a built SPA on disk, `/` serves Scalar and `/openapi.json`. With a SPA present (`/app/static` or `./static`), `/` serves the SPA and disables Scalar.

## Verify

Check the surface you changed:
- Backend: `bun run backend:check` (requires Docker)
- Frontend: `bun run frontend:check && bun run frontend:typecheck && bun run frontend:test`
- API / OpenAPI: `bun run generate:client`, then `cd frontend && bun run orval:drift` (see `.agents/skills/regenerate-api-client/SKILL.md`; does not need Docker/DB)
