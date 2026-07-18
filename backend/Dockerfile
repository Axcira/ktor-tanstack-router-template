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

# ---- runtime stage ----
FROM docker.io/eclipse-temurin:25-jre
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libargon2-1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /build/build/libs/backend-all.jar /app/app.jar
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", \
    "--enable-native-access=ALL-UNNAMED", \
    "-jar", "/app/app.jar"]
