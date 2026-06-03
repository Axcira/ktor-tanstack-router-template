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

    apiRouting("/users") {
        /**
         * Create a new user
         *
         * OperationID: createUser
         */
        post {
            val user = call.receive<CreateUserInput>()
            val createdUser = userService.createUser(user)
            val permissions =
                permissionService.getPermissionsForUser(createdUser.id) ?: throw IllegalArgumentException("User permissions not found")
            call.sessions.set(UserSession(createdUser, permissions))
            call.respond(HttpStatusCode.Created, createdUser)
        }

        authenticate {

            get(){
                val allUsers = userService.getAllUsers()
                call.respond(allUsers)
            }

            /**
             * Get current user
             *
             * OperationID: getSelf
             */
            get("/me") {
                val principal = call.principal<UserSession>() ?: throw IllegalArgumentException("User not authenticated")
                call.respond(principal)
            }

            /**
             * Update the current user
             *
             * OperationID: updateMe
             */
            put("/me") {
                val principal = call.principal<UserSession>() ?: throw IllegalArgumentException("User not authenticated")
                val userId = principal.user.id
                val user = call.receive<UpdateUserInput>()
                userService.update(userId, user)
                call.respond(HttpStatusCode.NoContent)
            }

            /**
             * Delete the current user
             *
             * OperationID: deleteMe
             */
            delete("/me") {
                val principal = call.principal<UserSession>() ?: throw IllegalArgumentException("User not authenticated")
                val userId = principal.user.id
                userService.delete(userId)
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}

