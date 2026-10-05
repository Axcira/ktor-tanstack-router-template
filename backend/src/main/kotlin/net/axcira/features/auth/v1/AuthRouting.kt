@file:OptIn(ExperimentalKtorApi::class)

package net.axcira.features.auth.v1

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import io.ktor.utils.io.*
import net.axcira.apiRouting
import net.axcira.features.auth.AuthService
import net.axcira.features.auth.ChangePasswordRequest
import net.axcira.features.auth.ChangePasswordResult
import net.axcira.features.auth.LoginRequest
import net.axcira.features.auth.UserSession
import net.axcira.features.permissions.Permission
import net.axcira.features.permissions.withPermission
import net.axcira.plugins.ValidationErrorBody

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

        authenticate {
            withPermission(Permission.ChangePassword) {
                /**
                 * Change the signed-in user's password.
                 * Requires ChangePassword and the current password.
                 * When logoutOtherSessions is true, other cookie sessions for this user are deleted.
                 * The current session stays. Omitted or false leaves other sessions in place.
                 *
                 * OperationID: changePasswordV1
                 */
                post("/password") {
                    val session = call.principal<UserSession>() ?: throw IllegalArgumentException("User not authenticated")
                    val request = call.receive<ChangePasswordRequest>()
                    when (
                        val result =
                            authService.changePassword(
                                userId = session.user.id,
                                currentPassword = request.currentPassword,
                                newPassword = request.newPassword,
                                logoutOtherSessions = request.logoutOtherSessions,
                                keepSessionId = call.request.cookies["user_session"],
                            )
                    ) {
                        ChangePasswordResult.Success -> {
                            call.respond(HttpStatusCode.NoContent)
                        }

                        ChangePasswordResult.WrongPassword -> {
                            call.respond(HttpStatusCode.Unauthorized)
                        }

                        is ChangePasswordResult.Invalid -> {
                            call.respond(HttpStatusCode.BadRequest, ValidationErrorBody(reasons = result.reasons))
                        }
                    }
                }
            }
        }
    }
}
