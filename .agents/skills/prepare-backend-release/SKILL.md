---
name: prepare-backend-release
description: Use when preparing a backend release — runs tests and builds the distributable JAR
---

# prepare-backend-release

Build a production-ready backend artifact and optionally a Docker image.
This skill is **provider-neutral** — it does not push images, deploy, or
publish anything.  It only verifies, tests, and assembles the deliverable.

## Scope

- Run backend test suite (`./gradlew test`)
- Build the fat ShadowJar (`./gradlew shadowJar`)
- Optionally build a Docker image (`docker build ./ -t backend`)
- Verify the artifact exists and is runnable
- Does **not** push Docker images, publish to registries, or deploy to any
  environment
- Does **not** run Flyway migrations against production databases
- Does **not** start the backend server

## Prerequisites

1. **JDK 21** (toolchain) — verify with `java --version`.
2. **Docker** (required for tests via Testcontainers PostgreSQL; also needed
   for the optional Docker image build).
3. **No manual DB / admin environment variables required for tests** —
   Testcontainers provisions an ephemeral PostgreSQL, and the test
   configuration in `build.gradle.kts` sets `SKIP_BOOTSTRAP=true` and
   `SKIP_DATABASE=true` automatically.  See the
   [Env vars table in `AGENTS.md`](../../../AGENTS.md#env-vars) if you do
   need to override defaults in other contexts.
4. **Clean working tree** recommended (uncommitted changes may affect test
   reliability or produce a non-reproducible artifact).

## Steps

1. **Run the test suite**

   ```bash
   cd backend
   ./gradlew test
   ```

   This starts a Testcontainers PostgreSQL instance (requires Docker),
   runs Flyway migrations, and executes all JUnit Platform tests.
   Tests use `SKIP_BOOTSTRAP=true` and `SKIP_DATABASE=true` by default
   (configured in `build.gradle.kts`).

   **All tests must pass** before proceeding to the build step.

2. **Build the ShadowJar**

   ```bash
   ./gradlew shadowJar
   ```

   Produces `backend/build/libs/backend-all.jar` — a fat JAR containing the
   application and all its dependencies (excluding `logback.xml` which is
   excluded in the build config).

3. **Verify the artifact**

   ```bash
   test -s build/libs/backend-all.jar && echo "JAR exists and is non-empty"
   jar tf build/libs/backend-all.jar | grep -c '\.class'
   ```

   Confirm the JAR exists, is non-empty, and contains compiled classes.
   Runtime smoke-testing (e.g. starting the JAR) requires an explicitly
   configured database and environment — it is **not** part of this skill;
   use `./gradlew run` or your deployment pipeline for that.

4. **(Optional) Build Docker image**

   From the **repository root** (not `backend/`):

   ```bash
   podman build -t backend .
   # or: docker build -t backend .
   ```

   Multi-stage build:
   - **frontend**: Bun installs workspace deps and builds the Vite SPA
   - **builder**: Compile and produce the fat JAR using JDK 21
   - **runtime**: JRE 25 image with the fat JAR and SPA at `/app/static`

   Presence of `/app/static/index.html` makes Ktor serve the SPA at `/`
   instead of Scalar. Skip this step if you are not using containers.
   The skill does **not** tag with version numbers or push to any registry.

## Confirmation / destructive boundaries

- No code modifications — the skill only runs existing build and test
  commands.
- No deployments, no registry pushes, no database migrations against
  production.
- The Docker build is **optional** and requires explicit opt-in.  The skill
  never builds or pushes Docker images without being asked.
- The skill does not create git tags or GitHub releases.

## Verification

- All tests pass (JUnit XML reports in `build/reports/tests/test/`).
- `backend-all.jar` is present and runnable.
- If Docker image was built: `docker images backend` shows the image.
- Verify the JAR manifest with `jar tf build/libs/backend-all.jar`.

## Safe failure

| Failure | Behaviour |
|---------|-----------|
| Test failures | Fix failing tests before proceeding; inspect `build/reports/tests/test/index.html` |
| `shadowJar` fails | Check compilation errors; verify dependencies resolve |
| Missing JDK 21 | Install via SDKMAN, asdf, or system package manager |
| Docker not available | Tests will fail (Testcontainers requires Docker); install Docker first |
| Docker build fails | Check Dockerfile syntax and base image availability |

## Environment variables reference

Refer to the [Env vars section in `AGENTS.md`](../../../AGENTS.md#env-vars) for
the complete list of supported variables, defaults, and purposes.  Sensible
defaults exist for local development; in CI environment variables can be
overridden as needed.

## See also

- [`AGENTS.md`](../../../AGENTS.md) — Dev startup, testing, Docker build commands
- [`Dockerfile`](../../../Dockerfile) — Multi-stage Docker build (repo root)
- [`backend/build.gradle.kts`](../../../backend/build.gradle.kts) — ShadowJar and test configuration
