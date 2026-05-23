plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(ktorLibs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)
}

group = "net.axcira"
version = "1.0.0-SNAPSHOT"

application {
    mainClass = "io.ktor.server.cio.EngineMain"
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
    implementation(ktorLibs.server.openapi)
    implementation(ktorLibs.server.routingOpenapi)
    implementation(ktorLibs.server.sessions)
    implementation(ktorLibs.server.swagger)
    implementation(ktorLibs.server.htmlBuilder)
    implementation(libs.exposed.core)
    implementation(libs.exposed.jdbc)
    implementation(libs.exposed.dao)
    implementation(libs.postgresql)
    implementation(libs.logback.classic)
    implementation(libs.hikaricp)
    implementation("org.jetbrains.kotlinx:kotlinx-html:0.12.0")
    implementation("io.insert-koin:koin-ktor:4.2.0")
    implementation("io.insert-koin:koin-logger-slf4j:4.2.0")
    implementation(libs.argon2.jvm)

    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)
}

ktor {
    openApi {
        enabled = true
        codeInferenceEnabled = true
    }
}
