---
name: regenerate-api-client
description: Use when regenerating the TypeScript API client from the backend OpenAPI specification
---

# regenerate-api-client

Regenerate the typed frontend API client (Orval + TanStack Query hooks) from
the backend's OpenAPI spec.  The pipeline is:

```
Ktor routes (annotated)  →  ./gradlew generateOpenApiJson  →  openapi.json
                                                                    ↓
                                              bun run orval:gen (Orval)  →  src/api/generated/
```

Generated files live under `frontend/src/api/generated/` and **must not be
hand-edited** — they are overwritten on every regeneration.

## Scope

- Generate `backend/generated/openapi.json` via Gradle (standalone runner
  that does **not** require Docker or a running database — `SKIP_DATABASE`
  and `SKIP_BOOTSTRAP` are already wired in `build.gradle.kts`).
- Run Orval to produce typed hooks, schemas, and mocks in
  `frontend/src/api/generated/`.
- Biome format is applied automatically by Orval's `afterAllFilesWrite` hook.
- Verify no drift against version control.
- Optionally run `bun run check` and `bun run build` to validate formatting and integration. Biome lint and assist exclude generated files, while format-check still applies; Orval's hook keeps generated formatting deterministic.

## Prerequisites

- **JDK 25** (toolchain) — verify with `java --version`.
- **Bun** — verify with `bun --version`.
- **No Docker or database required** — the OpenAPI generation runs with
  `SKIP_DATABASE=true` and `SKIP_BOOTSTRAP=true`, which skip all
  database-related initialisation.  The Gradle task `generateOpenApiJson`
  uses a standalone main class (`net.axcira.GenerateOpenApiKt`).

## Steps

1. **Generate the OpenAPI specification**

   ```bash
   cd backend
   ./gradlew generateOpenApiJson
   ```

   This compiles Kotlin sources (if needed) and runs the standalone OpenAPI
   generator, writing to `backend/generated/openapi.json`.  The task sets
   `SKIP_BOOTSTRAP=true` and `SKIP_DATABASE=true` automatically.

   On success you should see `BUILD SUCCESSFUL` and the file
   `generated/openapi.json` will exist.

2. **Generate the frontend API client**

   ```bash
   cd frontend
   bun run orval:gen
   ```

   Orval reads `../backend/generated/openapi.json` and outputs typed files
   to `src/api/generated/`.  After all files are written, Biome format is
   run automatically (via `afterAllFilesWrite` in `orval.config.ts`).

3. **Check for drift against version control**

   ```bash
   bun run orval:drift
   ```

   This runs Orval then checks `git diff --exit-code` on the generated
   directory plus any untracked files.  A clean exit (exit code 0) means the
   generated output matches what is committed — a **pass** confirms
   reproducibility.

   A non-zero exit (drift detected) is **expected after intentional backend
   changes** and indicates the generated files need to be committed.  In CI
   this is a hard failure — generated output must always match the committed
   spec.  Inspect `git diff -- src/api/generated/` to review what changed.

4. **Verify frontend integration** (optional but recommended)

   ```bash
   bun run check   # Biome format-check; lint/assist exclude generated files
   bun run build   # Vite production build
   ```

   This validates the generated types and hooks compile cleanly against the
   rest of the application. Biome lint and assist exclude generated files,
   but format-check still applies. Formatting of generated output is owned
   by Orval's `afterAllFilesWrite` hook.

## Confirmation / destructive boundaries

- Files under `src/api/generated/` are overwritten without warning — they
  are considered **derived** and should never be edited by hand.
- The skill does **not** modify backend source code, route definitions, or
  any hand-written frontend files.
- The `orval:drift` step is non-destructive — it only reads and compares.
  Use it to decide whether to commit the new output.

## Verification

- Verify `backend/generated/openapi.json` is non-empty valid JSON.
- Verify `frontend/src/api/generated/` contains the expected files (e.g.,
  `*.ts` for each tag group, `schemas/` for types).
- Run `bun run check` and `bun run build` to validate formatting and frontend integration.
- Inspect `git status` on `src/api/generated/` to see what changed.

## Safe failure

| Failure | Behaviour |
|---------|-----------|
| `./gradlew generateOpenApiJson` fails | Compilation error in backend code — fix Kotlin first |
| `bun run orval:gen` fails | Check `openapi.json` validity; malformed spec may cause Orval parse errors |
| `orval:drift` detects changes | Clean-tree drift audit — **expected** after backend changes (commit intentionally); **failure** in CI where generated output must match committed spec |
| `bun run build` fails | Inspect generated types and API changes for frontend integration errors |
| Missing `SKIP_DATABASE` env | Verify `build.gradle.kts` tasks — the `generateOpenApiJson` task sets it |

## See also

- [`AGENTS.md`](../../../AGENTS.md) — Codegen pipeline explanation
- [`backend/build.gradle.kts`](../../../backend/build.gradle.kts) — `generateOpenApiJson` task definition
- [`frontend/orval.config.ts`](../../../frontend/orval.config.ts) — Orval configuration
- [`frontend/package.json`](../../../frontend/package.json) — `orval:gen` / `orval:drift` scripts
