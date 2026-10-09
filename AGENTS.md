# AGENTS.md

Operating rules for agents in this monorepo. Human setup lives in [README.md](README.md).

Kotlin package is `net.axcira`. Backend is Ktor on a JDK 25 toolchain (Exposed, HikariCP, Flyway). Frontend is a TanStack Router + React + Vite SPA, installed from the root [Bun workspace](https://bun.sh/docs/install/workspace). Use Bun. Do not use npm, pnpm, or yarn.

## Commands

From the repository root, after `bun install`:

| Intent | Command |
|---|---|
| Postgres | `docker compose up -d --wait` or `./dev.sh` |
| Ktor on :8080 | `bun run backend:dev` |
| Vite on :3000 (`/api` → :8080) | `bun run frontend:dev` |
| Backend test + ktlint | `bun run backend:check` |
| Frontend lint + format | `bun run frontend:check` |
| Frontend types | `bun run frontend:typecheck` |
| Frontend tests | `bun run frontend:test` |
| OpenAPI + Orval client | `bun run generate:client` |

`bun run backend:test` and `bun run backend:check` need Docker. Testcontainers starts `postgres:18.4` once per JVM. OpenAPI generation does not need Docker or a database.

## Do not hand-edit

- `frontend/src/routeTree.gen.ts` — TanStack Router Vite plugin
- `frontend/src/api/generated/` — Orval
- `backend/generated/openapi.json` — `generateOpenApiJson`

Commit the generated client. CI runs `bun run orval:drift` in the `docker` job (using the OpenAPI artifact from `backend`, without Gradle) and fails on drift. After an Orval upgrade, pin the version, regenerate, and commit the client.

`frontend/src/components/ui/` is shadcn output. Biome ignores it. Change it only to add or refresh a component.

## Backend

Each feature is a vertical slice under `backend/src/main/kotlin/net/axcira/features/<name>/`:

- `<Name>Service.kt` plus request and response types in the feature package
- `v1/<Name>Routing.kt` exposing `fun Application.<name>()`

Wire a new feature in both places:

1. `provide<XService>()` inside the `dependencies` block in `Application.kt`
2. A module line in `src/main/resources/application.yaml` under `ktor.application.modules`

`apiRouting("/articles")` mounts `/api/v1/articles` (version defaults to 1). Put a KDoc on each route that includes `OperationID:`; that id is the generated TypeScript function name.

Tables are objects in `net.axcira.db`. The Exposed Gradle plugin discovers every `Table` there. Create a migration with `./gradlew generateMigrations` from `backend/`. Review the SQL before committing — Exposed can emit destructive statements such as `DROP COLUMN`. Unapplied migrations run on startup.

Sessions are cookie-based. There is no public registration API. Admins create users (`ManageUsers`, UI at `/permissions/users`). `ApplicationInitializer` seeds the admin role and user on startup unless `SKIP_BOOTSTRAP=true`. `ADMIN_PASSWORD` is required outside development; development falls back to `password`.

Permission checks belong in `Permission.satisfies` on the server. `Administrator` bypasses every check. `ManageArticles` implies the article permissions. `UpdateArticle` and `DeleteArticle` carry `allowOthers`. The client may treat a permission with only `type` as a local shortcut, then calls `can-i` for anything compound. Do not reimplement that algebra in TypeScript.

Request-body validation is `plugins/RequestValidation.kt`. Failures are `400` with `{ message, reasons }`. Health is `GET /api/v1/health` (database ping; `503` when it fails).

Tests use `test { }` from `BaseTest.kt`: one shared Ktor app, schema migrated once, `TRUNCATE ... RESTART IDENTITY CASCADE` between tests, a fresh HTTP client per test. Gradle sets fast Argon2 parameters for tests only.

Kotlin style is official (`kotlin.code.style=official`). ktlint allows star imports and does not enforce argument-list wrapping. Lefthook formats staged `backend/**/*.kt` on commit.

`ktor-server-test-host` is on the `codegen` and `test` classpaths only. Do not add it to `main`.

## Frontend

`@/*` maps to `./src/*`.

Authenticated pages live under `src/routes/_app/`. That layout loads the session and redirects to `/hero` when it is missing. Put the page in the route file. Colocate pieces used by that route in a sibling `-components/` directory — TanStack Router ignores the `-` prefix, so those files are not routes. Add sidebar entries in `src/components/layout/sidebar/MenuItems.tsx`.

Server data goes through the generated client (`@/api/generated/`). Theme state is Jotai in `src/store/theme.ts`. Gate UI with `useAuthorize` (`src/hooks/useAuthorize.ts`).

Confirmations and errors use Dialog, AlertDialog, or Sonner. Do not call `window.alert` or `window.confirm`.

`src/routes/_app/showcase/` is the reference UI. Match its density and components. If showcase code fails lint, fix the code. Do not relax Biome or CI for it.

Biome uses double quotes and 2-space indent. Lint and assist skip `src/api/generated/`; format-check still applies. Orval's `afterAllFilesWrite` hook formats generated files.

Tests are Vitest + Testing Library + MSW. Shared setup is `src/test/`. Cover session shortcuts and `can-i` UI reactions here. Leave compound permission matrices to backend tests.

## Codegen pipeline

```
Exposed tables (net.axcira.db)
  → ./gradlew generateMigrations → src/main/resources/db/migration
Ktor routes + OpenAPI KDoc
  → src/codegen GenerateOpenApi.kt → backend/generated/openapi.json
  → Orval → frontend/src/api/generated/
TanStack Router Vite plugin → frontend/src/routeTree.gen.ts (on dev/build)
```

After a route or schema change:

```bash
bun run generate:client
cd frontend && bun run orval:drift
```

`generateOpenApiJson` sets `SKIP_DATABASE` and `SKIP_BOOTSTRAP`. Follow `.agents/skills/regenerate-api-client/SKILL.md` when regenerating.

OpenAPI `operationId` inference depends on the Kotlin version paired with the Ktor catalog. Bump them together. A mismatch can drop operation ids and rename every generated hook.

## Rename project

Rename package, slug, or display name with the repo script. Dry-run first. `--package` is required.

```bash
bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App"
bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App" --write
```

Follow `.agents/skills/rename-project/SKILL.md`. The worktree must be clean unless the user explicitly accepts `--allow-dirty`. Do not pass `--write` until the user confirms the dry-run. Generated files are outside the script; regenerate the client afterward. The script does not edit IntelliJ `workspace.xml` / `.iml` files or rename the parent directory.

## Environment

Ktor reads the process environment. It does not load `.env`. Copy [`.env.example`](.env.example) and export the variables, or inject them from Docker, systemd, or the shell.

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `postgres` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |
| `ADMIN_EMAIL` | `admin@example.com` | Bootstrap admin email |
| `ADMIN_ROLE_NAME` | `Administrator` | Bootstrap admin role |
| `ADMIN_PASSWORD` | `password` in development; required otherwise | Bootstrap admin password |
| `SECRET` | `secret` | Argon2 pepper |
| `ARGON2_ITERATIONS` | `16` | Argon2id time cost |
| `ARGON2_MEMORY_KIB` | `65536` | Argon2id memory (KiB) |
| `ARGON2_PARALLELISM` | `1` | Argon2id lanes |
| `STATIC_DIR` | probe `/app/static`, then `./static` | SPA root; must contain `index.html` |
| `SERVE_FRONTEND` | unset | Force SPA serving when a probed `index.html` exists |
| `EXPOSE_OPENAPI` | unset | Keep `/openapi.json` while the SPA is served |
| `SKIP_DATABASE` | unset | Skip Flyway; allow startup without a live database |
| `SKIP_BOOTSTRAP` | unset | Skip admin seed |

With no SPA on disk, Scalar is served at `/` and the spec at `/openapi.json`. When the SPA is served, Scalar at `/` is off.

## Production image

Package prebuilt artifacts (same layout CI uses). From the repository root:

```bash
cd backend && ./gradlew prepareDockerImageContext && cd ..
bun run frontend:build
rm -rf image-context && mkdir -p image-context/static
cp -a backend/build/docker-image/lib image-context/lib
cp backend/build/docker-image/app.jar image-context/app.jar
cp -a frontend/dist/. image-context/static/
podman build -f Dockerfile -t backend image-context
```

To compile inside the image instead (local only; CI does not use this):

```bash
podman build -f Dockerfile.source -t backend .
```

The runtime image is JRE 25 with static files at `/app/static`. The entrypoint passes `--enable-native-access=ALL-UNNAMED` for Argon2 JNI.

CI builds the image in the `docker` job from uploaded artifacts. Pushes to `ghcr.io/<owner>/<repo>` (lowercased) on: push to `main` (`:latest` and `:<sha7>`); PRs with the `push-image` label (`:pr-<n>` and `:<sha7>`, forks never push); `workflow_dispatch` with `push=true` (`:pr-<n>` and `:<sha7>` when an open PR exists for the branch, else `:<sha7>` only).

## Verify

Check the surface you changed:

- Kotlin: `bun run backend:check`
- Frontend: `bun run frontend:check && bun run frontend:typecheck && bun run frontend:test`
- API shape: `bun run generate:client`, then `bun run orval:drift` in `frontend/`
