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
import net.axcira.features.auth.ACCOUNT_LIMIT_REACHED
import net.axcira.features.auth.AccountPlan
import net.axcira.features.auth.AuthService
import net.axcira.features.auth.ChangePasswordRequest
import net.axcira.features.auth.ChangePasswordResult
import net.axcira.features.auth.DeviceSession
import net.axcira.features.auth.ErrorResponse
import net.axcira.features.auth.LoginRequest
import net.axcira.features.auth.LoginResponse
import net.axcira.features.auth.MAX_ACCOUNTS_PER_DEVICE
import net.axcira.features.auth.SESSION_COOKIE_NAME
import net.axcira.features.auth.SESSION_SUPERSEDED
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
            val authenticated =
                authService.login(request.email, request.password)
                    ?: return@post call.respond(HttpStatusCode.Unauthorized)
            val previousSessionId = call.request.cookies[SESSION_COOKIE_NAME]
            when (
                val plan =
                    authService.rotateLogin(
                        deviceSessionId = previousSessionId,
                        userId = authenticated.user.id,
                        addAccount = request.addAccount,
                    )
            ) {
                AccountPlan.LimitReached -> {
                    call.respond(
                        HttpStatusCode.Conflict,
                        ErrorResponse(
                            code = ACCOUNT_LIMIT_REACHED,
                            message =
                                "This browser already has $MAX_ACCOUNTS_PER_DEVICE signed-in accounts. " +
                                    "Sign out of one account before adding another.",
                        ),
                    )
                }

                AccountPlan.SessionConflict -> {
                    call.respond(
                        HttpStatusCode.Conflict,
                        ErrorResponse(
                            code = SESSION_SUPERSEDED,
                            message =
                                "This browser session was already replaced. Reload and continue with the signed-in accounts.",
                        ),
                    )
                }

                is AccountPlan.Ready -> {
                    // clear() invalidates whatever id the tracker still holds. Do that before pointing
                    // the tracker at the id rotateLogin already stored, or the new rows would be deleted.
                    call.sessions.clear<DeviceSession>()
                    @Suppress("UNCHECKED_CAST")
                    call.attributes.allKeys
                        .filter { it.name == "SessionId" }
                        .forEach { key -> call.attributes.remove(key as io.ktor.util.AttributeKey<Any>) }
                    call.attributes.put(io.ktor.util.AttributeKey<String>("SessionId"), plan.sessionId)
                    call.sessions.set(
                        DeviceSession(
                            defaultUserId = authenticated.user.id,
                            accounts = plan.accounts,
                        ),
                    )
                    call.respond(
                        LoginResponse(
                            user = authenticated.user,
                            permissions = authenticated.permissions,
                            accountIndex = plan.accountIndex,
                        ),
                    )
                }
            }
        }

        /**
         * Logout
         *
         * OperationID: logoutV1
         */
        post("/logout") {
            call.sessions.clear<DeviceSession>()
            call.respond(HttpStatusCode.NoContent)
        }

        authenticate {
            withPermission(Permission.ChangePassword) {
                /**
                 * Change the signed-in user's password.
                 * Requires ChangePassword and the current password.
                 * When logoutOtherSessions is true, this user's account sessions on other device sessions are revoked.
                 * The account on this device stays, including any other accounts signed in beside it.
                 * Omitted or false leaves other account sessions in place.
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
                                keepSessionId = call.request.cookies[SESSION_COOKIE_NAME],
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
