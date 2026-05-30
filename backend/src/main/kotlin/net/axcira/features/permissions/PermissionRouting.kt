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
            }
            route("/roles") {
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
                        is UpdateResult.NotModified -> call.respond(HttpStatusCode.NotModified)
                    }
                }

                delete("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    val deleteRoleInput = call.receive<DeleteRoleInput>()
                    permissionService.delete(id, deleteRoleInput)
                    call.respond(HttpStatusCode.NoContent)
                }
            }
        }
    }
}
