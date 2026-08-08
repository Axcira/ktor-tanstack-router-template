# backend

Ktor + Exposed API for this monorepo (JDK 25 toolchain).

## Commands

From the repository root:

```bash
bun run backend:dev       # ./gradlew run (auto-reload)
bun run backend:test      # requires Docker/Podman (Testcontainers)
bun run backend:check
bun run generate:openapi
```

Or from this directory:

```bash
./gradlew run
./gradlew test
./gradlew shadowJar
./gradlew generateOpenApiJson
```

## Notes

- Vertical-slice features live under `src/main/kotlin/net/axcira/features/`
- Register modules in `src/main/resources/application.yaml` and DI in `Application.kt`
- OpenAPI file export lives in `src/codegen/` (`generateOpenApiJson`); `ktor-server-test-host` is not a production dependency
- Container image: build from the **repository root** (`Dockerfile`), not this directory
- Env vars: see root `.env.example` and `AGENTS.md`

See the repository root [README.md](../README.md) and [AGENTS.md](../AGENTS.md) for full setup.
