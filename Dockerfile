# Package prebuilt artifacts. This image does not compile anything.
# Context directory (not the repository root):
#   backend-all.jar    backend/build/libs/backend-all.jar  (./gradlew shadowJar)
#   static/            frontend/dist                       (bun run frontend:build)
# To compile inside the image instead:
#   podman build -f Dockerfile.source -t backend .
FROM docker.io/eclipse-temurin:25-jre
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libargon2-1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser appuser

COPY backend-all.jar /app/app.jar
COPY static /app/static
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

# Presence of /app/static/index.html disables Scalar and serves the SPA at /.
ENTRYPOINT ["java", \
    "--enable-native-access=ALL-UNNAMED", \
    "-jar", "/app/app.jar"]
