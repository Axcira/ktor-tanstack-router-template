package net.axcira.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import net.axcira.features.permissions.NoPermissionException

fun Application.statusPage() {
    install(StatusPages) {
        exception<NoPermissionException> { call, _ ->
            call.respond(HttpStatusCode.Forbidden)
        }
    }
}
