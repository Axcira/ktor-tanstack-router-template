# build stage
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /build

COPY gradle/ gradle/
COPY gradlew gradlew
COPY build.gradle.kts build.gradle.kts
COPY settings.gradle.kts settings.gradle.kts
RUN ./gradlew dependencies --no-daemon

COPY src/ src/
RUN ./gradlew shadowJar --no-daemon


# AOT Record stage (to minimize cold start time)
FROM eclipse-temurin:25-jre AS aot
WORKDIR /app
COPY --from=builder /build/build/libs/backend-all.jar /app/app.jar

RUN apt-get update && apt-get install -y --no-install-recommends \
    libargon2-1 \
    postgresql \
    && rm -rf /var/lib/apt/lists/*

RUN service postgresql start && \
    su postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'password';\"" && \
    java -XX:AOTMode=record -XX:AOTConfiguration=/app/ktor.aot.conf \
        --enable-native-access=ALL-UNNAMED \
        -jar /app/app.jar & \
    PID=$! && sleep 15 && kill -15 $PID && wait $PID || true && \
    java -XX:AOTMode=create -XX:AOTConfiguration=/app/ktor.aot.conf \
        -XX:AOTCache=/app/ktor.aot \
        --enable-native-access=ALL-UNNAMED \
        -jar /app/app.jar || true


# Run stage
FROM docker.io/eclipse-temurin:25-jre
WORKDIR /app

COPY --from=aot /app/app.jar /app/app.jar
COPY --from=aot /app/ktor.aot /app/ktor.aot

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:AOTCache=/app/ktor.aot", \
    "--enable-native-access=ALL-UNNAMED", \
    "-jar", "/app/app.jar"]

