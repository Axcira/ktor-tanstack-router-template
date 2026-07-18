package net.axcira.plugins

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.root() {
    routing {
        route("/api") {
            get("/") {
                call.respondText("Hello, World, Reloading!")
            }
            get("/json/kotlinx-serialization") {
                call.respond(mapOf("hello" to "world"))
            }
        }
    }
}
