# Build from the repository root:
#   podman build -t ghcr.io/example/app:1.0 .

# ---- frontend stage ----
FROM docker.io/oven/bun:1.2 AS frontend
WORKDIR /src

COPY package.json bun.lock ./
COPY frontend/package.json frontend/package.json
# Skip prepare (lefthook) — git hooks are irrelevant inside the image
RUN bun install --frozen-lockfile --ignore-scripts

COPY frontend/ frontend/
RUN bun run --cwd frontend build

# ---- backend builder ----
FROM docker.io/eclipse-temurin:21-jdk AS builder
WORKDIR /build

COPY backend/gradle/ gradle/
COPY backend/gradlew gradlew
COPY backend/build.gradle.kts build.gradle.kts
COPY backend/settings.gradle.kts settings.gradle.kts
COPY backend/gradle.properties gradle.properties
COPY backend/src/ src/
# Persist Gradle caches across builds (deps + build cache). A separate
# dependencies/classes warm-up layer is not worth it once this mount exists:
# it doubles Gradle startup on buildscript changes and does not speed up
# source-only rebuilds (measured: ~30s either way for the jar step).
RUN --mount=type=cache,id=application-gradle,target=/root/.gradle \
    ./gradlew shadowJar --no-daemon

# ---- runtime ----
FROM docker.io/eclipse-temurin:25-jre
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libargon2-1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /build/build/libs/backend-all.jar /app/app.jar
COPY --from=frontend /src/frontend/dist /app/static
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

# Presence of /app/static/index.html disables Scalar and serves the SPA at /.
ENTRYPOINT ["java", \
    "--enable-native-access=ALL-UNNAMED", \
    "-jar", "/app/app.jar"]
