package net.axcira.features.permissions
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.apiRouting

suspend fun Application.permissions() {
    val permissionService: PermissionService by dependencies

    apiRouting {
        authenticate {
            route("/permissions") {
                get {
                    val userid = call.request.queryParameters["userid"]?.toUIntOrNull() ?: throw IllegalArgumentException("No user id found")
                    val permissions = permissionService.getPermissionsForUser(userid) ?: return@get call.respond(HttpStatusCode.NotFound)
                    call.respond(permissions)
                }
        }
            route("/role"){


                get ("/{roleId}") {
                    val roleId = call.request.queryParameters["roleId"]?.toUIntOrNull() ?: throw IllegalArgumentException("No role id found")
                    val role = permissionService.getRoleById(roleId)
                    call.respond(role ?: HttpStatusCode.NotFound)
                }
                post{
                     val role = call.receive<CreateRoleInput>()
                     permissionService.create(role)
                     call.respond(HttpStatusCode.Created,permissionService)
                }

                patch("/{id}") {
                    val id = call.request.queryParameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    val scheme = call.receive<UpdateRoleInput>()
                    val role =permissionService.update(disposeAndJoin())
                }

                delete ("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    val fallbackRoleId = call.parameters["fallbackRoleId"]?.toUIntOrNull() ?: throw IllegalArgumentException("No fallback id found")
                    permissionService.delete(id,fallbackRoleId)
                    call.respond(HttpStatusCode.NoContent)
                }
            }
    }
}
}