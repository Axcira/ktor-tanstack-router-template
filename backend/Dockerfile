# ---- builder stage ----
# Compile the application and produce the fat JAR.
FROM docker.io/eclipse-temurin:21-jdk AS builder
WORKDIR /build

# Gradle dependency cache layer (invalidated only when build config changes)
COPY gradle/ gradle/
COPY gradlew gradlew
COPY build.gradle.kts build.gradle.kts
COPY settings.gradle.kts settings.gradle.kts
RUN ./gradlew dependencies --no-daemon

# Source + build
COPY src/ src/
RUN ./gradlew shadowJar --no-daemon

# ---- aot stage ----
# Profile the running application (DB-free) and create the AOT cache.
FROM docker.io/eclipse-temurin:25-jdk AS aot
WORKDIR /build

COPY --from=builder /build/build/libs/backend-all.jar /build/backend-all.jar

# Install curl only (no PostgreSQL / libargon2).
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN set -e; \
    \
    SKIP_DATABASE=true SKIP_BOOTSTRAP=true java \
        -XX:AOTMode=record -XX:AOTConfiguration=/build/ktor.aot.conf \
        --enable-native-access=ALL-UNNAMED \
        -jar /build/backend-all.jar & \
    JAVA_PID=$!; \
    \
    trap 'kill "$JAVA_PID" 2>/dev/null || true; wait "$JAVA_PID" 2>/dev/null || true; exit 1' EXIT; \
    \
    i=0; \
    while [ "$i" -lt 30 ]; do \
        if curl -sf http://127.0.0.1:8080/openapi.json >/dev/null 2>&1; then \
            break; \
        fi; \
        sleep 1; \
        i=$((i + 1)); \
    done; \
    curl -sf http://127.0.0.1:8080/openapi.json >/dev/null; \
    curl -sf http://127.0.0.1:8080/ >/dev/null; \
    \
    trap '' EXIT; \
    kill "$JAVA_PID" 2>/dev/null || true; \
    wait "$JAVA_PID" 2>/dev/null && true; java_exit=$?; \
    if [ "$java_exit" -ne 0 ] && [ "$java_exit" -ne 143 ]; then \
        echo "ERROR: Java exited with code $java_exit (expected 0 or 143/SIGTERM)"; \
        exit 1; \
    fi; \
    \
    test -s /build/ktor.aot.conf; \
    java -XX:AOTMode=create -XX:AOTConfiguration=/build/ktor.aot.conf \
        -XX:AOTCache=/build/ktor.aot \
        --enable-native-access=ALL-UNNAMED \
        -jar /build/backend-all.jar; \
    test -s /build/ktor.aot

# ---- runtime stage ----
FROM docker.io/eclipse-temurin:25-jdk
WORKDIR /app

RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /build/build/libs/backend-all.jar /app/app.jar
COPY --from=aot /build/ktor.aot /app/ktor.aot
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:AOTCache=/app/ktor.aot", \
    "--enable-native-access=ALL-UNNAMED", \
    "-jar", "/app/app.jar"]
