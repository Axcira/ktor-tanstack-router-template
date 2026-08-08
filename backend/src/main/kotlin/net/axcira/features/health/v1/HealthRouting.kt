package net.axcira.features.health.v1

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.apiRouting
import net.axcira.features.health.HealthService

fun Application.health() {
    val healthService: HealthService by dependencies

    apiRouting("/health") {
        /**
         * Health check (DB connectivity)
         *
         * OperationID: healthV1
         */
        get {
            val result = healthService.check()
            if (result.status == "ok") {
                call.respond(result)
            } else {
                call.respond(HttpStatusCode.ServiceUnavailable, result)
            }
        }
    }
}
