package net.axcira

import io.ktor.server.cio.*

fun main(args: Array<String>) {
    if (System.getProperty("io.ktor.server.sessions.deferred") == null) {
        System.setProperty("io.ktor.server.sessions.deferred", "true")
    }
    EngineMain.main(args)
}
