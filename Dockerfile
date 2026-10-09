# Package prebuilt artifacts. This image does not compile anything.
# Context directory (not the repository root):
#   lib/               backend/build/docker-image/lib  (./gradlew prepareDockerImageContext)
#   app.jar            backend/build/docker-image/app.jar
#   static/            frontend/dist                       (bun run frontend:build)
# To compile inside the image instead:
#   podman build -f Dockerfile.source -t backend .
FROM docker.io/eclipse-temurin:25-jre
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libargon2-1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser appuser

# Dependency jars change only when Gradle lockfiles / catalogs change.
COPY lib /app/lib
# Frontend static assets change independently of backend code.
COPY static /app/static
# Thin application jar — small layer on code-only changes.
COPY app.jar /app/app.jar
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

# Presence of /app/static/index.html disables Scalar and serves the SPA at /.
ENTRYPOINT ["java", \
    "--enable-native-access=ALL-UNNAMED", \
    "-cp", "/app/lib/*:/app/app.jar", \
    "net.axcira.MainKt"]
