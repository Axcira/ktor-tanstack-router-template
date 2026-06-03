package net.axcira.features.permissions

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.UpdateResult
import net.axcira.apiRouting
import net.axcira.features.auth.UserSession

fun Application.permissions() {
    val permissionService: PermissionService by dependencies

    apiRouting {
        authenticate {
            route("/permissions") {
                get {
                    val userid =
                        call.request.queryParameters["userid"]?.toUIntOrNull() ?: throw IllegalArgumentException("No user id found")
                    val permissions = permissionService.getPermissionsForUser(userid) ?: return@get call.respond(HttpStatusCode.NotFound)
                    call.respond(permissions)
                }

                /**
                 * Check permission for user
                 *
                 * OperationID: canI
                 */
                post("/can-i") {
                    val permissions = call.principal<UserSession>()?.permissions ?: throw IllegalArgumentException("User not authenticated")
                    val requested = call.receive<Permission>()
                    val result = permissions.satisfies(requested)
                    if (result) {
                        call.respond(HttpStatusCode.OK)
                    } else {
                        call.respond(HttpStatusCode.Forbidden)
                    }
                }
            }
            route("/roles") {

                get {
                    val roles = permissionService.getAllRoles()
                    call.respond(roles)
                }

                get("/{roleId}") {
                    val roleId = call.parameters["roleId"]?.toUIntOrNull() ?: throw IllegalArgumentException("No role id found")
                    val role = permissionService.getRoleById(roleId) ?: return@get call.respond(HttpStatusCode.NotFound)
                    call.respond(role)
                }
                post {
                    val role = call.receive<CreateRoleInput>()
                    val createdRole = permissionService.create(role)
                    call.respond(HttpStatusCode.Created, createdRole)
                }

                patch("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    val scheme = call.receive<UpdateRoleInput>()
                    when (val role = permissionService.update(id, scheme)) {
                        is UpdateResult.Success -> call.respond(HttpStatusCode.OK, role.value)
                        is UpdateResult.NotFound -> call.respond(HttpStatusCode.NotFound)
                        is UpdateResult.NotModified -> call.respond(HttpStatusCode.NoContent)
                    }
                }

                delete("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    val fallbackRoleId = call.request.queryParameters["fallbackRoleId"]?.toUIntOrNull()
                        ?: throw IllegalArgumentException("fallbackRoleId is required")
                    permissionService.delete(id, fallbackRoleId)
                    call.respond(HttpStatusCode.NoContent)
                }

            }
        }
    }
}
