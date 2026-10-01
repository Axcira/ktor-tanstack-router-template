rootProject.name = "backend"

pluginManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
    versionCatalogs {
        create("ktorLibs").from("io.ktor:ktor-version-catalog:3.6.0")
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

buildCache {
    local {
        // Keep task outputs out of ~/.gradle/caches. setup-gradle's basic provider
        // snapshots that directory under an immutable key, so a build cache stored
        // there freezes on the first run after a Gradle file change.
        directory = file(".gradle/build-cache")
    }
}
