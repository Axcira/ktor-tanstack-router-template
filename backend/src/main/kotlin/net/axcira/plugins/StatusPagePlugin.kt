package net.axcira.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.requestvalidation.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import kotlinx.serialization.Serializable
import net.axcira.features.permissions.NoPermissionException

@Serializable
data class ValidationErrorBody(
    val message: String = "Validation failed",
    val reasons: List<String>,
)

fun Application.statusPage() {
    install(StatusPages) {
        val appLog = this@statusPage.log
        exception<RequestValidationException> { call, cause ->
            appLog.info("Validation failed: ${call.request.local.uri}: ${cause.reasons}")
            call.respond(HttpStatusCode.BadRequest, ValidationErrorBody(reasons = cause.reasons))
        }
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
