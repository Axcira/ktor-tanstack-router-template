package net.axcira.features.permissions

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.routing.*
import net.axcira.features.auth.UserSession

class PermissionRouteSelector(private val permission: String) : RouteSelector() {
    override suspend fun evaluate(context: RoutingResolveContext, segmentIndex: Int) = RouteSelectorEvaluation.Constant
    override fun toString() = "(requirePermission: $permission)"
}

class NoPermissionException(val permission: Permission) : Exception("User does not have permission: $permission")

fun Iterable<Permission>.satisfies(permission: Permission) = any { it.satisfies(permission) }

inline fun <reified T : Permission> permissionPlugin(permission: T) = createRouteScopedPlugin(
    "RequirePermission_${T::class.java.simpleName}"
) {
    on(AuthenticationChecked) { call ->
        val principal = call.principal<UserSession>() ?: return@on
        val hasPermission = principal.permissions.satisfies(permission)
        if (!hasPermission) {
            throw NoPermissionException(permission)
        }
    }
}

inline fun <reified T : Permission> Route.withPermission(permission: T, block: Route.() -> Unit) {
    val permissionName = T::class.simpleName ?: throw IllegalArgumentException("Cannot retrieve permission name")
    createChild(PermissionRouteSelector(permissionName)).apply {
        install(permissionPlugin(permission))
        block()
    }
}
