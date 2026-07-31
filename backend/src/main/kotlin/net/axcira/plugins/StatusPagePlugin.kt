package net.axcira.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import net.axcira.features.permissions.NoPermissionException

fun Application.statusPage() {
    install(StatusPages) {
        val appLog = this@statusPage.log
        exception<NoPermissionException> { call, cause ->
            appLog.warn("Access denied: ${call.request.local.uri}: ${cause.message}")
            call.respond(HttpStatusCode.Forbidden)
        }
        exception<Throwable> { call, cause ->
            appLog.error("Unhandled exception: ${call.request.local.uri}", cause)
            call.respond(HttpStatusCode.InternalServerError)
        }
    }
}
