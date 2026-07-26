# Build context MUST be the repository root:
#   podman build -f backend/Dockerfile -t ghcr.io/example/app:1.0 .

# ---- frontend stage ----
FROM docker.io/oven/bun:1.2 AS frontend
WORKDIR /src

COPY package.json bun.lock ./
COPY frontend/package.json frontend/package.json
RUN bun install --frozen-lockfile

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
RUN ./gradlew dependencies --no-daemon

COPY backend/src/ src/
RUN ./gradlew shadowJar --no-daemon

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
