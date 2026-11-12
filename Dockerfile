# Package prebuilt artifacts. This image does not compile anything.
# Context directory (not the repository root):
#   lib/               backend/build/docker-image/lib  (./gradlew prepareDockerImageContext)
#   app.jar            backend/build/docker-image/app.jar
#   static/            frontend/dist                       (bun run frontend:build)
# To compile inside the image instead:
#   podman build -f Dockerfile.source -t backend .
# Runtime has no shell or package manager; for an interactive shell use
# gcr.io/distroless/java25-debian13:debug with the same layout under /app.
FROM gcr.io/distroless/java25-debian13:nonroot
WORKDIR /app

# UID/GID 65532 is the distroless nonroot user.
# Dependency jars change only when Gradle lockfiles / catalogs change.
COPY --chown=65532:65532 lib /app/lib
# Frontend static assets change independently of backend code.
COPY --chown=65532:65532 static /app/static
# Thin application jar — small layer on code-only changes.
COPY --chown=65532:65532 app.jar /app/app.jar

EXPOSE 8080

# Presence of /app/static/index.html disables Scalar and serves the SPA at /.
ENTRYPOINT ["java", \
    "--enable-native-access=ALL-UNNAMED", \
    "-cp", "/app/lib/*:/app/app.jar", \
    "net.axcira.MainKt"]
