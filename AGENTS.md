# Development Template

## Dev startup order

### Root install (Bun workspace)

```bash
bun install                              # One-shot: installs frontend deps + Lefthook
```

### Fast path

```bash
./dev.sh                              # Starts PostgreSQL, prints next commands
```

### Manual steps

```bash
docker compose up -d --wait           # Postgres on :5432 (--wait waits for healthcheck)
bun run backend:dev                   # Ktor dev server on :8080 (auto-reload via watch classes)
bun run frontend:dev                  # Vite dev server on :3000 (HMR, proxies /api -> :8080)
```

Or with legacy cd-into commands:

```bash
cd backend && ./gradlew run           # Ktor dev server on :8080 (auto-reload via watch classes)
cd frontend && bun run dev            # Vite dev server on :3000 (HMR, proxies /api -> :8080)
```

For full DX, also run in separate terminals:

```bash
bun run generate:openapi -t -i        # continuous OpenAPI spec generation
bun run orval:watch                   # watches generated spec -> regenerates TS client
```

Or the legacy equivalents:

```bash
# generateOpenApiJson compiles the codegen source set — combine with Ktor dev for auto reload
cd backend && ./gradlew generateOpenApiJson -t -i
cd frontend && bun run orval:watch
```

## Backend (Ktor / Kotlin / Gradle)

- **JDK**: 25 (toolchain). Main class: `net.axcira.MainKt` (sets `io.ktor.server.sessions.deferred=true` and logback config).
- **Key tasks**:
  - `./gradlew run` — dev server with auto-reload (watches `classes`)
  - `./gradlew test` — JUnit Platform (uses Testcontainers PostgreSQL, **requires Docker**)
  - `./gradlew shadowJar` — fat JAR at `build/libs/backend-all.jar`
  - `./gradlew generateMigrations` — creates Flyway SQL in `src/main/resources/db/migration/` from Exposed table objects in `net.axcira.db`
  - `./gradlew generateOpenApiJson` — runs `src/codegen` (`GenerateOpenApi.kt` + `TestApplication`) and writes `generated/openapi.json`; `ktor-server-test-host` is `codegen`/`test` only (not production)
  - `./gradlew generateClient` — runs Orval in `../frontend` after generating OpenAPI spec
- **Architecture**: Vertical slice — each feature is a self-contained `features/<name>/` dir with `*Routing.kt` + `*Service.kt`.
- **Module registration**: Add routing function reference to `src/main/resources/application.yaml` under `ktor.application.modules`. Add `provide<XService>()` call in `Application.kt`'s `dependencies` block. Feature routing is always under `/api/v{version}/<name>` (default `v1`) via `apiRouting()`.
- **API root**: Versioned API routes use `apiRouting()` in `Application.kt` (`/api/v1/...`). Health: `GET /api/v1/health` (DB ping; `503` when unhealthy).
- **Request validation**: Ktor `RequestValidation` (`plugins/RequestValidation.kt`) validates request DTOs; failures return `400` with `{ message, reasons }` via StatusPages.
- **Database**: Exposed ORM + HikariCP + Flyway migrations. Env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. Dev defaults: localhost:5432, user/pass `postgres`/`password`.
- **Init**: `ApplicationInitializer.kt` runs on `ApplicationStarted` — seeds admin role + user from env vars (`ADMIN_ROLE_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). `ADMIN_PASSWORD` defaults to `"password"` in dev mode.
- **OpenAPI**: Local/API-only mode serves Scalar at `/` and `/openapi.json`. When a production SPA is present under `/app/static` (or `STATIC_DIR` / `./static` with `index.html`), Scalar is disabled and Ktor serves the SPA instead (`configureFrontend`). Set `EXPOSE_OPENAPI=true` to keep `/openapi.json` in production. Spec file export lives in the `codegen` source set (`src/codegen/kotlin/.../GenerateOpenApi.kt`), not `main`.
- **Testing**: `test()` helper from `BaseTest.kt` spins up a suite-scoped Testcontainers PostgreSQL, migrates once, truncates between tests, and reuses a shared Ktor `TestApplication` + per-test HTTP client (**requires Docker**).
- **Docker build**: from **repo root**: `podman build -t backend .` or `docker build -t backend .` (Bun frontend build → JDK 25 shadowJar → JRE 25 runtime with `/app/static`). Entrypoint runs the fat JAR with `--enable-native-access=ALL-UNNAMED` (for Argon2 JNI). See root `Dockerfile` (not `backend/Dockerfile`). Manual GH Actions workflow `Docker` builds and pushes to `ghcr.io/<owner>/<repo>` (`workflow_dispatch`).
- **Env template**: Root `.env.example` lists supported variables (copy to `.env` for local notes; the app does not auto-load `.env` — export or inject via your runtime).

## Frontend (TanStack Router / React / Vite / Bun)

- **Package manager**: `bun` (not npm/pnpm/yarn). Install deps with `bun i` (root workspace: `bun install` in repo root).
- **Key scripts** (run from `frontend/`):
  - `bun run dev` — Vite dev on port 3000, proxies `/api` -> `http://localhost:8080`
  - `bun run build` — outputs to `dist/`
  - `bun run test` — Vitest
  - `bun run check` — Biome lint + format in one pass
  - `bun run lint` / `bun run format`
  - `bun run cf:dev` — local Wrangler dev server with Static Assets
  - `bun run cf:deploy` — build + deploy to Cloudflare Workers Static Assets
- **Path alias**: `@/*` maps to `./src/*` (both Vite and tsconfig). Use `import Foo from "@/components/Foo"`.
- **Generated files — DO NOT EDIT**:
  - `src/routeTree.gen.ts` — TanStack Router auto-generates from `src/routes/`
  - `src/api/generated/` — Orval generates typed TanStack Query hooks + schemas from `../backend/generated/openapi.json`
  - Both are re-generated on save by the `tanstackRouter()` vite plugin and `orval --watch` respectively.
- **Styling**: Tailwind CSS v4 + `shadcn/tailwind.css` + `tw-animate-css`. Components via shadcn/ui in `src/components/ui/`.
- **State**: Jotai (`src/store/theme.ts`) + TanStack Query for server state.
- **Lint/Format**: Biome. Config ignores `src/routeTree.gen.ts`, `src/styles.css`, `src/components/ui`. `organizeImports` runs on save (`biome.json` `assist.actions.source.organizeImports`). Double quotes enforced.
- **EditorConfig**: 2-space indent for `.ts`/`.tsx`.

When generating frontend, you SHOULD load appropriate frontend-related skills, then read showcase pages to create beautiful and useful UI.

## Codegen pipeline

```
Exposed tables -> Flyway migrations (generateMigrations)
                    ↓
Ktor routes + OpenAPI annotations
                    ↓
codegen GenerateOpenApi.kt (TestApplication) -> generated/openapi.json
                    ↓
Orval -> frontend/src/api/generated/
                    ↓
routeTree.gen.ts (TanStack Router vite plugin, auto on save)
```

`ktor-server-test-host` is scoped to the `codegen` and `test` configurations only.
## Rename project

Use the automated rename script at the repository root:

```bash
# Dry-run first (safe, prints planned changes)
bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App"

# Apply with --write (requires clean Git worktree unless --allow-dirty)
bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App" --write
```

See `bun scripts/rename.ts --help` for full options. The package option is required; slug and display name are optional but recommended.

## Conventions

- **New backend feature**: Copy an existing `features/<name>/` package, rename classes and files, add routing to `application.yaml`, add service to `Application.kt` dependencies block. Routes land under `/api/v1/<name>` via `apiRouting()`.
- **New frontend route**: Add file in `src/routes/`. Put page UI in the route file; colocate shared pieces in a sibling `-components/` folder (TanStack ignores `-` prefixes). Plugin auto-generates `routeTree.gen.ts`.
- **JS double quotes** (Biome config).
- **Kotlin**: `kotlin.code.style=official`.
- **Testing**: Backend tests follow `test { }` pattern from `BaseTest.kt`.

## Env vars

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` | localhost | Postgres host |
| `DB_PORT` | 5432 | Postgres port |
| `DB_NAME` | postgres | Database name |
| `DB_USER` | postgres | DB user |
| `DB_PASSWORD` | password | DB password |
| `ADMIN_PASSWORD` | password (dev) / required (prod) | Bootstrap admin password |
| `ADMIN_EMAIL` | admin@example.com | Bootstrap admin email |
| `ADMIN_ROLE_NAME` | Administrator | Bootstrap admin role name |
| `ARGON2_ITERATIONS` | 16 | Argon2id time cost (tests set to 1 via Gradle) |
| `ARGON2_MEMORY_KIB` | 65536 | Argon2id memory in KiB (tests set to 1024) |
| `ARGON2_PARALLELISM` | 1 | Argon2id parallelism |
| `SECRET` | secret | Password pepper for Argon2 |
| `STATIC_DIR` | (auto) | SPA root directory override (`index.html` required). Defaults try `/app/static` then `./static` |
| `SERVE_FRONTEND` | unset | Force frontend-serving mode even if probing (still needs `index.html`) |
| `EXPOSE_OPENAPI` | unset | When SPA is served, set `true` to also expose `/openapi.json` |
| `SKIP_DATABASE` | unset | Skip Flyway migrate; allow Hikari start without live DB (codegen / tests) |
| `SKIP_BOOTSTRAP` | unset | Skip admin role/user seeding on startup (codegen / tests) |

See also root `.env.example`.

## Learned User Preferences

- Keep the Orval-generated client under `frontend/src/api/generated/` committed; prefer `orval:drift` detection over gitignoring the client or auto-generating it in pre-commit/CI
- Treat showcase routes as agent-facing reference UI; keep them production-quality (fix lint issues rather than relaxing Biome/CI for showcase)
- Prefer Dialog / AlertDialog / toast over `window.alert` / `confirm` for app error and confirmation UX
- For Dependabot triage, treat green CI + minor/patch bumps as generally merge-safe (Docker/base-image updates: run the manual `Docker` workflow or a local image build)

## Learned Workspace Facts

- CI runs `bun run orval:drift`; after Orval upgrades, pin the package exactly and regenerate/commit the client so drift stays green
- No public self-registration API; user creation is admin-only via ManageUsers (`/permissions/users`)
- Container images publish via manual `Docker` workflow (`.github/workflows/docker.yml`) to `ghcr.io/<owner>/<repo>`; Dependabot Docker/base-image bumps can be verified with that workflow or a local `podman`/`docker build`
- Frontend authz tests cover session/static shortcuts and `can-i` UI reactions (MSW); permission algebra (`satisfies`, Admin bypass, `allowOthers`) stays in backend tests—do not reimplement compound permission matrices on the frontend
- Bumping the Ktor version catalog without the Kotlin version required for OpenAPI inference can zero out `operationId`s and rename Orval hooks; keep Kotlin and Ktor bumps paired when inference is involved
