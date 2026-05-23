package net.axcira.plugins

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.sessions.*
import kotlinx.serialization.Serializable


@Serializable
data class UserSession(val userId: UInt)

fun Application.configureAuthentication() {
    install(Sessions) {
        cookie<UserSession>("user_session")
    }
    install(Authentication) {
        session<UserSession>()
    }
}
