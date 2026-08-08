import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import org.jetbrains.exposed.v1.gradle.plugin.VersionFormat

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(ktorLibs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.exposed)
    alias(libs.plugins.ktlint)
}

group = "net.axcira"
version = "1.0.0-SNAPSHOT"

application {
    mainClass = "net.axcira.MainKt"
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=true")
}

kotlin {
    jvmToolchain(25)
}

// OpenAPI file export needs TestApplication; keep test-host off the production classpath.
val codegen =
    sourceSets.create("codegen") {
        compileClasspath += sourceSets.main.get().output
        runtimeClasspath += sourceSets.main.get().output
    }
configurations[codegen.implementationConfigurationName].extendsFrom(configurations.implementation.get())
configurations[codegen.runtimeOnlyConfigurationName].extendsFrom(configurations.runtimeOnly.get())

ktlint {
    version.set(libs.versions.ktlintEngine.get())
}

dependencies {
    implementation(ktorLibs.serialization.kotlinx.json)
    implementation(ktorLibs.server.auth)
    implementation(ktorLibs.server.callLogging)
    implementation(ktorLibs.server.cio)
    implementation(ktorLibs.server.config.yaml)
    implementation(ktorLibs.server.contentNegotiation)
    implementation(ktorLibs.server.core)
    implementation(ktorLibs.server.di)
    implementation(ktorLibs.server.openapi)
    implementation(ktorLibs.server.routingOpenapi)
    implementation(ktorLibs.server.sessions)
    implementation(ktorLibs.server.statusPages)
    implementation(ktorLibs.server.requestValidation)
    implementation(ktorLibs.server.swagger)
    implementation(ktorLibs.server.htmlBuilder)
    implementation(libs.exposed.core)
    implementation(libs.exposed.jdbc)
    implementation(libs.exposed.dao)
    implementation(libs.exposed.json)
    implementation(libs.postgresql)
    implementation(libs.logback.classic)
    implementation(libs.hikaricp)
    implementation("org.jetbrains.kotlinx:kotlinx-html:0.12.0")
    implementation(libs.argon2.jvm)
    implementation(libs.flyway.core)
    implementation(libs.flyway.database.postgresql)

    "codegenImplementation"(ktorLibs.server.testHost)

    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)
    testImplementation(libs.h2)
    testImplementation(ktorLibs.client.contentNegotiation)
    testImplementation(ktorLibs.client.serialization)
    testImplementation(libs.testcontainers.postgresql)
}

ktor {
    openApi {
        enabled = true
        codeInferenceEnabled = true
    }
}

tasks.register<JavaExec>("generateOpenApiJson") {
    description = "Generate OpenAPI Specification."
    dependsOn(codegen.classesTaskName)
    classpath = codegen.runtimeClasspath
    mainClass.set("net.axcira.GenerateOpenApiKt")
    environment("SKIP_BOOTSTRAP", "true")
    environment("SKIP_DATABASE", "true")
}

tasks.register<Exec>("generateClient") {
    description = "Generate frontend client code from OpenAPI specification using Orval."
    dependsOn("generateOpenApiJson")

    workingDir = file("../frontend")
    commandLine("bun", "run", "orval:gen")
}

tasks.test {
    useJUnitPlatform()
    systemProperty("io.ktor.development", "true")
    environment("SKIP_BOOTSTRAP", "true")
    environment("SKIP_DATABASE", "true")
    // Fast Argon2 for tests only (production defaults remain 16 / 65536 KiB / 1).
    environment("ARGON2_ITERATIONS", "1")
    environment("ARGON2_MEMORY_KIB", "1024")
    environment("ARGON2_PARALLELISM", "1")
}

exposed {
    migrations {
        tablesPackage.set("net.axcira.db")
        testContainersImageName.set("postgres:18.4")
        fileVersionFormat.set(VersionFormat.MAJOR_ONLY)
    }
}

tasks.named<ShadowJar>("shadowJar") {
    duplicatesStrategy = DuplicatesStrategy.INCLUDE
    mergeServiceFiles()
    exclude("logback.xml")
}
