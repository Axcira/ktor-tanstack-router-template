package net.axcira.features.users

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import net.axcira.apiRouting
import net.axcira.features.auth.UserSession
import net.axcira.features.permissions.PermissionService

fun Application.users() {
    val userService: UserService by dependencies
    val permissionService: PermissionService by dependencies

    apiRouting {
        /**
         * Create a new user
         *
         * OperationID: createUser
         */
        post("/users") {
            val user = call.receive<CreateUserInput>()
            val createdUser = userService.createUser(user)
            val permissions = permissionService.getPermissionsForUser(createdUser.id)
            call.sessions.set(UserSession(createdUser.id, permissions))
            call.respond(HttpStatusCode.Created, createdUser)
        }

        authenticate {
            /**
             * Get current user
             *
             * OperationID: getSelf
             */
            get("/users/me") {
                val userId = call.sessions.get<UserSession>()?.userId ?: throw IllegalArgumentException("User not authenticated")
                val user = userService.findById(userId) ?: throw IllegalArgumentException("User not found")
                call.respond(user)
            }

            /**
             * Update the current user
             *
             * OperationID: updateMe
             */
            put("/users/me") {
                val userId = call.sessions.get<UserSession>()?.userId ?: throw IllegalArgumentException("User not authenticated")
                val user = call.receive<UpdateUserInput>()
                userService.update(userId, user)
                call.respond(HttpStatusCode.NoContent)
            }

            /**
             * Delete the current user
             *
             * OperationID: deleteMe
             */
            delete("/users/me") {
                val userId = call.sessions.get<UserSession>()?.userId ?: throw IllegalArgumentException("User not authenticated")
                userService.delete(userId)
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}

