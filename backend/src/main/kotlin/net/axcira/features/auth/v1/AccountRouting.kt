@file:OptIn(ExperimentalKtorApi::class)

package net.axcira.features.auth.v1

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.utils.io.*
import net.axcira.apiRouting
import net.axcira.features.auth.AuthService
import net.axcira.features.auth.LogoutAccountResult
import net.axcira.features.auth.MAX_ACCOUNTS_PER_DEVICE
import net.axcira.features.auth.SESSION_COOKIE_NAME
import net.axcira.plugins.ValidationErrorBody

fun Application.accounts() {
    val authService: AuthService by dependencies

    apiRouting("/accounts") {
        /**
         * List the accounts signed in on this browser.
         * Does not require X-Account-Index. Never returns tokens or session ids.
         *
         * OperationID: listAccountsV1
         */
        get {
            val deviceSessionId = call.request.cookies[SESSION_COOKIE_NAME]
            if (deviceSessionId == null) {
                call.respond(HttpStatusCode.Unauthorized)
                return@get
            }
            val accounts = authService.listAccounts(deviceSessionId)
            if (accounts == null) {
                call.respond(HttpStatusCode.Unauthorized)
                return@get
            }
            call.respond(accounts)
        }

        /**
         * Sign out one account on this browser. Other accounts stay signed in.
         * Any index is safe: an unknown or already signed-out slot responds 404.
         *
         * OperationID: logoutAccountV1
         */
        post("/{index}/logout") {
            val index = call.parameters["index"]?.toIntOrNull()
            if (index == null || index !in 0 until MAX_ACCOUNTS_PER_DEVICE) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ValidationErrorBody(reasons = listOf("index must be an integer from 0 to 9")),
                )
                return@post
            }
            val deviceSessionId = call.request.cookies[SESSION_COOKIE_NAME]
            if (deviceSessionId == null) {
                call.respond(HttpStatusCode.Unauthorized)
                return@post
            }
            when (authService.logoutAccount(deviceSessionId, index)) {
                LogoutAccountResult.Success -> call.respond(HttpStatusCode.NoContent)
                LogoutAccountResult.Unauthenticated -> call.respond(HttpStatusCode.Unauthorized)
                LogoutAccountResult.NotFound -> call.respond(HttpStatusCode.NotFound)
            }
        }
    }
}
