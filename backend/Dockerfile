# build stage
FROM docker.io/eclipse-temurin:25-jdk AS builder
WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    libargon2-1 \
    postgresql \
    && rm -rf /var/lib/apt/lists/*


COPY gradle/ gradle/
COPY gradlew gradlew
COPY build.gradle.kts build.gradle.kts
COPY settings.gradle.kts settings.gradle.kts
RUN ./gradlew dependencies --no-daemon

COPY src/ src/
RUN ./gradlew shadowJar --no-daemon

# The admin password using ARG operation won't preserve on final image (i think)
ARG ADMIN_PASSWORD=password
ARG IS_LEYDEN=true

RUN service postgresql start && \
    su postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'password';\"" && \
    java -XX:AOTMode=record -XX:AOTConfiguration=/build/ktor.aot.conf \
        --enable-native-access=ALL-UNNAMED \
        -jar /build/build/libs/backend-all.jar & \
    PID=$! && sleep 5 && ./gradlew --no-daemon test || true && kill -15 $PID && wait $PID || true && \
    java -XX:AOTMode=create -XX:AOTConfiguration=/build/ktor.aot.conf \
        -XX:AOTCache=/build/ktor.aot \
        --enable-native-access=ALL-UNNAMED \
        -jar /build/build/libs/backend-all.jar || true

# Run stage
# we can't use jre image due to AOT cache
FROM docker.io/eclipse-temurin:25-jdk
WORKDIR /app

RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /build/build/libs/backend-all.jar /app/app.jar
COPY --from=builder /build/ktor.aot /app/ktor.aot
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:AOTCache=/app/ktor.aot", \
    "--enable-native-access=ALL-UNNAMED", \
    "-jar", "/app/app.jar"]

