package net.axcira.features.permissions.v1

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.*
import net.axcira.features.auth.UserSession
import net.axcira.features.permissions.CreateRoleInput
import net.axcira.features.permissions.Permission
import net.axcira.features.permissions.PermissionService
import net.axcira.features.permissions.UpdateRoleInput
import net.axcira.features.permissions.satisfies
import net.axcira.features.permissions.satisfiesAll
import net.axcira.features.permissions.withPermission
import net.axcira.plugins.Optional

fun Application.permissions() {
    val permissionService: PermissionService by dependencies

    apiRouting {
        authenticate {
            route("/permissions") {
                withPermission<Permission>(Permission.ManageRoles) {
                    /**
                     * Get permissions for a specific user
                     *
                     * OperationID: getUserPermissionsV1
                     */
                    get {
                        val userid =
                            call.request.queryParameters["userid"]?.toUIntOrNull() ?: throw IllegalArgumentException("No user id found")
                        val permissions =
                            permissionService.getPermissionsForUser(userid) ?: return@get call.respond(HttpStatusCode.NotFound)
                        call.respond(permissions)
                    }
                }

                /**
                 * Check permission for user
                 *
                 * OperationID: canIV1
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
                /**
                 * Get all roles
                 *
                 * OperationID: getRolesV1
                 */
                get {
                    val pagination =
                        Pagination(
                            call.request.queryParameters["limit"]?.toIntOrNull() ?: 20,
                            call.request.queryParameters["offset"]?.toIntOrNull() ?: 0,
                        )
                    val roles = permissionService.getAllRoles(pagination)
                    call.respond(roles)
                }

                withPermission<Permission>(Permission.ManageRoles) {
                    /**
                     * Get role by ID
                     *
                     * OperationID: getRoleByIdV1
                     */
                    get("/{roleId}") {
                        val roleId = call.parameters["roleId"]?.toUIntOrNull() ?: throw IllegalArgumentException("No role id found")
                        val role = permissionService.getRoleById(roleId) ?: return@get call.respond(HttpStatusCode.NotFound)
                        call.respond(role)
                    }

                    /**
                     * Create a new role
                     *
                     * OperationID: createRoleV1
                     */
                    post {
                        val callerPermissions =
                            call.principal<UserSession>()?.permissions ?: throw IllegalArgumentException("User not authenticated")
                        val role = call.receive<CreateRoleInput>()
                        if (!callerPermissions.satisfiesAll(role.permissions)) {
                            call.respond(HttpStatusCode.Forbidden)
                            return@post
                        }
                        val createdRole = permissionService.create(role)
                        call.respond(HttpStatusCode.Created, createdRole)
                    }

                    /**
                     * Update a role by ID
                     *
                     * OperationID: updateRoleV1
                     */
                    patch("/{id}") {
                        val callerPermissions =
                            call.principal<UserSession>()?.permissions ?: throw IllegalArgumentException("User not authenticated")
                        val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                        val existing = permissionService.getRoleById(id) ?: return@patch call.respond(HttpStatusCode.NotFound)
                        if (!callerPermissions.satisfiesAll(existing.permissions)) {
                            call.respond(HttpStatusCode.Forbidden)
                            return@patch
                        }
                        val scheme = call.receive<UpdateRoleInput>()
                        if (scheme.permissions is Optional.Present && !callerPermissions.satisfiesAll(scheme.permissions.value)) {
                            call.respond(HttpStatusCode.Forbidden)
                            return@patch
                        }
                        when (val role = permissionService.update(id, scheme)) {
                            is UpdateResult.Success -> call.respond(HttpStatusCode.OK, role.value)
                            is UpdateResult.NotFound -> call.respond(HttpStatusCode.NotFound)
                            is UpdateResult.NotModified -> call.respond(HttpStatusCode.NoContent)
                        }
                    }

                    /**
                     * Delete a role by ID with a fallback role
                     *
                     * OperationID: deleteRoleV1
                     */
                    delete("/{id}") {
                        val callerPermissions =
                            call.principal<UserSession>()?.permissions ?: throw IllegalArgumentException("User not authenticated")
                        val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                        val fallbackRoleId =
                            call.request.queryParameters["fallbackRoleId"]?.toUIntOrNull()
                                ?: throw IllegalArgumentException("fallbackRoleId is required")

                        if (fallbackRoleId == id) {
                            call.respond(HttpStatusCode.BadRequest, "fallbackRoleId cannot be the same as the role to delete")
                            return@delete
                        }

                        val fallbackRole = permissionService.getRoleById(fallbackRoleId)
                        if (fallbackRole == null) {
                            call.respond(HttpStatusCode.BadRequest, "fallbackRoleId does not exist")
                            return@delete
                        }

                        val targetRole = permissionService.getRoleById(id) ?: return@delete call.respond(HttpStatusCode.NotFound)
                        if (!callerPermissions.satisfiesAll(targetRole.permissions) ||
                            !callerPermissions.satisfiesAll(fallbackRole.permissions)
                        ) {
                            call.respond(HttpStatusCode.Forbidden)
                            return@delete
                        }

                        permissionService.delete(id, fallbackRoleId)
                        call.respond(HttpStatusCode.NoContent)
                    }
                }
            }
        }
    }
}
