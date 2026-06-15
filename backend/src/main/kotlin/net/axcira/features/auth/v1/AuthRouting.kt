@file:OptIn(ExperimentalKtorApi::class)

package net.axcira.features.auth.v1

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import io.ktor.utils.io.*
import net.axcira.apiRouting
import net.axcira.features.auth.AuthService
import net.axcira.features.auth.LoginRequest
import net.axcira.features.auth.UserSession

fun Application.auth() {
    val authService: AuthService by dependencies

    apiRouting("/auth") {
        /**
         * Authenticate (Login)
         *
         * OperationID: loginV1
         */
        post("/login") {
            val request = call.receive<LoginRequest>()
            val session = authService.login(request.email, request.password) ?: return@post call.respond(HttpStatusCode.Unauthorized)
            call.sessions.set(session)
            call.respond(session)
        }

        /**
         * Logout
         *
         * OperationID: logoutV1
         */
        post("/logout") {
            call.sessions.clear<UserSession>()
            call.respond(HttpStatusCode.NoContent)
        }
    }
}
