# Development Template

## Dev startup order

### Fast path

```bash
./dev.sh                              # Starts PostgreSQL, prints next commands
```

### Manual steps

```bash
docker compose up -d --wait           # Postgres on :5432 (--wait waits for healthcheck)
cd backend && ./gradlew run           # Ktor dev server on :8080 (auto-reload via watch classes)
cd frontend && bun run dev            # Vite dev server on :3000 (HMR, proxies /api -> :8080)
```

For full DX, also run in separate terminals:

```bash
cd backend && ./gradlew generateOpenApiJson -t -i   # continuous OpenAPI spec generation. this task depends on compileKotlin, so you can combine it with Ktor dev server to achieve auto reloading
cd frontend && bun run orval:watch                  # watches generated spec -> regenerates TS client
```

## Backend (Ktor / Kotlin / Gradle)

- **JDK**: 21 (toolchain). Main class: `net.axcira.MainKt` (sets `io.ktor.server.sessions.deferred=true` and logback config).
- **Key tasks**:
  - `./gradlew run` — dev server with auto-reload (watches `classes`)
  - `./gradlew test` — JUnit Platform (uses Testcontainers PostgreSQL, **requires Docker**)
  - `./gradlew shadowJar` — fat JAR at `build/libs/backend-all.jar`
  - `./gradlew generateMigrations` — creates Flyway SQL in `src/main/resources/db/migration/` from Exposed table objects in `net.axcira.db`
  - `./gradlew generateOpenApiJson` — writes `generated/openapi.json`
  - `./gradlew generateClient` — runs Orval in `../frontend` after generating OpenAPI spec
- **Architecture**: Vertical slice — each feature is a self-contained `features/<name>/` dir with `*Routing.kt` + `*Service.kt`.
- **Module registration**: Add routing function reference to `src/main/resources/application.yaml` under `ktor.application.modules`. Add `provide<XService>()` call in `Application.kt`'s `dependencies` block. Feature routing is always under `/api/<name>`.
- **API root**: All routes are nested under `/api/` via the `apiRouting()` helper in `Application.kt`.
- **Database**: Exposed ORM + HikariCP + Flyway migrations. Env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. Dev defaults: localhost:5432, user/pass `postgres`/`password`.
- **Init**: `ApplicationInitializer.kt` runs on `ApplicationStarted` — seeds admin role + user from env vars (`ADMIN_ROLE_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). `ADMIN_PASSWORD` defaults to `"password"` in dev mode.
- **OpenAPI**: Served at `/openapi.json` via Ktor plugin; generated Standalone runner in `GenerateOpenApi.kt`.
- **Testing**: `test()` helper from `BaseTest.kt` spins up a suite-scoped Testcontainers PostgreSQL, migrates once, truncates between tests, and reuses a shared Ktor `TestApplication` + per-test HTTP client (**requires Docker**).
- **Docker build**: `docker build ./ -t backend` (multi-stage: JDK 21 builder → JRE 25 runtime). Entrypoint runs the fat JAR with `--enable-native-access=ALL-UNNAMED` (for Argon2 JNI).

## Frontend (TanStack Router / React / Vite / Bun)

- **Package manager**: `bun` (not npm/pnpm/yarn). Install deps with `bun i`.
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
Ktor routes + OpenAPI annotations -> /openapi.json -> Orval -> frontend/src/api/generated/
                    ↓
              routeTree.gen.ts (TanStack Router vite plugin, auto on save)
```

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

- **New backend feature**: Copy an existing `features/<name>/` package, rename classes and files, add routing to `application.yaml`, add service to `Application.kt` dependencies block.
- **New frontend route**: Add file in `src/routes/`. TanStack Router plugin auto-generates `routeTree.gen.ts`.
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
