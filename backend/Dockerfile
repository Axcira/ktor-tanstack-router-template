FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# 1. ローカルのJARファイルをコンテナに配置
COPY build/libs/backend-all.jar app.jar

# 2. 一連のAOTキャッシュ作成コマンドを「&& \」で1つのRUNにまとめる
RUN java -XX:AOTMode=record -XX:AOTConfiguration=ktor.aot.conf --enable-native-access=ALL-UNNAMED -jar app.jar & \
    PID=$! && \
    sleep 5 && \
    kill -15 $PID && \
    wait $PID || true && \
    java -XX:AOTMode=create -XX:AOTConfiguration=ktor.aot.conf --enable-native-access=ALL-UNNAMED -XX:AOTCache=ktor.aot -jar app.jar || true

EXPOSE 8080

ENTRYPOINT ["java", "--enable-native-access=ALL-UNNAMED", "-XX:AOTCache=ktor.aot", "-jar", "app.jar"]
