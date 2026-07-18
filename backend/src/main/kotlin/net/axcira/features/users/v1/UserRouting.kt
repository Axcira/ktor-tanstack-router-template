package net.axcira.features.users.v1

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.*
import net.axcira.features.auth.UserSession
import net.axcira.features.permissions.*
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UpdateUserInput
import net.axcira.features.users.UserService

fun Application.users() {
    val userService: UserService by dependencies

    apiRouting("/users") {
        authenticate {
            withPermission<Permission>(Permission.ManageUsers) {
                /**
                 * Get all users with pagination
                 *
                 * OperationID: getUsersV1
                 */
                get {
                    val pagination = Pagination(
                        call.request.queryParameters["limit"]?.toIntOrNull() ?: 20,
                        call.request.queryParameters["offset"]?.toIntOrNull() ?: 0,
                    )
                    val allUsers = userService.getAllUsers(pagination)
                    call.respond(allUsers)
                }

                /**
                 * Create a new user
                 *
                 * OperationID: createUserV1
                 */
                post("/create") {
                    val user = call.receive<CreateUserInput>()
                    val createdUser = userService.createUser(user)
                    call.respond(HttpStatusCode.Created, createdUser)
                }

                /**
                 * Update a user by ID
                 *
                 * OperationID: updateUserV1
                 */
                patch("/update/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    val user = call.receive<UpdateUserInput>()
                    when (userService.update(id, user)) {
                        is UpdateResult.Success, is UpdateResult.NotModified -> call.respond(HttpStatusCode.NoContent)
                        is UpdateResult.NotFound -> call.respond(HttpStatusCode.NotFound, "User not found")
                    }
                }

                /**
                 * Delete a user by ID
                 *
                 * OperationID: deleteUserV1
                 */
                delete("/delete/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    userService.delete(id)
                    call.respond(HttpStatusCode.NoContent)
                }
            }

            /**
             * Get current user
             *
             * OperationID: getSelfV1
             */
            get("/me") {
                val principal = call.principal<UserSession>() ?: throw IllegalArgumentException("User not authenticated")
                call.respond(principal)
            }

            /**
             * Update the current user
             *
             * OperationID: updateMeV1
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
             * OperationID: deleteMeV1
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
