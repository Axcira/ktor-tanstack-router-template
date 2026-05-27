@file:OptIn(ExperimentalKtorApi::class)

package net.axcira.features.auth

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import io.ktor.utils.io.*
import kotlinx.serialization.Serializable
import net.axcira.apiRouting

@Serializable
data class LoginRequest(val email: String, val password: String)

fun Application.auth() {
    val authService: AuthService by dependencies

    apiRouting {
        route("/auth") {
            /**
             * Authenticate (Login)
             *
             * OperationID: login
             */
            post("/login") {
                val request = call.receive<LoginRequest>()
                val session = authService.login(request.email, request.password)
                if (session == null) {
                    call.respond(HttpStatusCode.Unauthorized)
                    return@post
                }
                call.sessions.set(session)
                call.respond(session)
            }

            /**
             * Logout
             *
             * OperationID: logout
             */
            post("/logout") {
                call.sessions.clear<UserSession>()
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
