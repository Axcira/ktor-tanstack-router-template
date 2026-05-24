package net.axcira.plugins

import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.root() {
    get("/") {
        call.respondText("Hello, World!")
    }
    get("/json/kotlinx-serialization") {
        call.respond(mapOf("hello" to "world"))
    }
}
