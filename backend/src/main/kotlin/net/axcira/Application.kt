package net.axcira

import io.ktor.server.application.*
import io.ktor.server.routing.*
import net.axcira.plugins.module

fun Application.main() {
    module()
    install(IgnoreTrailingSlash)
}

fun Application.apiRouting(block: Route.() -> Unit) {
    routing {
        route("/api") {
            block()
        }
    }
}
