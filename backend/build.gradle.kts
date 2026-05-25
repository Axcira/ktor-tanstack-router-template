plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(ktorLibs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)
}

group = "net.axcira"
version = "1.0.0-SNAPSHOT"

application {
    mainClass = "io.ktor.server.cio.EngineMain"
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=true")
}

kotlin {
    jvmToolchain(21)
}
dependencies {
    implementation(ktorLibs.serialization.kotlinx.json)
    implementation(ktorLibs.server.auth)
    implementation(ktorLibs.server.cio)
    implementation(ktorLibs.server.config.yaml)
    implementation(ktorLibs.server.contentNegotiation)
    implementation(ktorLibs.server.core)
    implementation(ktorLibs.server.di)
    implementation(ktorLibs.server.openapi)
    implementation(ktorLibs.server.routingOpenapi)
    implementation(ktorLibs.server.sessions)
    implementation(ktorLibs.server.swagger)
    implementation(ktorLibs.server.htmlBuilder)
    implementation(ktorLibs.server.testHost)
    implementation(libs.exposed.core)
    implementation(libs.exposed.jdbc)
    implementation(libs.exposed.dao)
    implementation(libs.postgresql)
    implementation(libs.logback.classic)
    implementation(libs.hikaricp)
    implementation("org.jetbrains.kotlinx:kotlinx-html:0.12.0")
    implementation(libs.argon2.jvm)

    testImplementation(kotlin("test"))
    testImplementation(libs.h2)
    testImplementation(ktorLibs.client.contentNegotiation)
    testImplementation(ktorLibs.client.serialization)
}

ktor {
    openApi {
        enabled = true
        codeInferenceEnabled = true
    }
}

tasks.register<JavaExec>("generateOpenApiJson") {
    description = "Generate OpenAPI Specification."
    dependsOn("compileKotlin")
    classpath = sourceSets["main"].runtimeClasspath
    mainClass.set("net.axcira.GenerateOpenApiKt")
}

tasks.register<Exec>("generateClient") {
    description = "Generate frontend client code from OpenAPI specification using Orval."
    dependsOn("generateOpenApiJson")

    workingDir = file("../frontend")
    commandLine("npx", "orval")
}

tasks.test {
    useJUnitPlatform()
}
