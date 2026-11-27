package net.axcira.features.permissions

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.routing.*
import net.axcira.features.auth.UserSession

class PermissionRouteSelector(
    private val permission: String,
) : RouteSelector() {
    override suspend fun evaluate(
        context: RoutingResolveContext,
        segmentIndex: Int,
    ) = RouteSelectorEvaluation.Constant

    override fun toString() = "(requirePermission: $permission)"
}

class NoPermissionException(
    val permission: Permission,
) : Exception("User does not have permission: $permission")

/**
 * Returns `true` when at least one permission in this collection satisfies [permission].
 */
fun Iterable<Permission>.satisfies(permission: Permission) = any { it.satisfies(permission) }

/**
 * Returns `true` when every permission in [required] is satisfied by at least one permission in this collection.
 */
fun Iterable<Permission>.satisfiesAll(required: Iterable<Permission>) = required.all { satisfies(it) }

inline fun <reified T : Permission> permissionPlugin(permission: T) =
    createRouteScopedPlugin(
        "RequirePermission_${T::class.java.simpleName}",
    ) {
        on(AuthenticationChecked) { call ->
            val principal = call.principal<UserSession>() ?: return@on
            val hasPermission = principal.permissions.satisfies(permission)
            if (!hasPermission) {
                throw NoPermissionException(permission)
            }
        }
    }

inline fun <reified T : Permission> Route.withPermission(
    permission: T,
    block: Route.() -> Unit,
) {
    val permissionName = T::class.simpleName ?: throw IllegalArgumentException("Cannot retrieve permission name")
    createChild(PermissionRouteSelector(permissionName)).apply {
        install(permissionPlugin(permission))
        block()
    }
}

/**
 * Requires [Permission.ManageMasters] for [masterId].
 * The plugin name includes the id so two masters do not share one installation.
 */

/**
 * Requires [Permission.ManageMasters] for any id in [masterIds].
 * Used when one screen reads another master's labels, without granting edits.
 */
fun Route.requireAnyMaster(
    masterIds: List<String>,
    block: Route.() -> Unit,
) {
    val permissions = masterIds.map { Permission.ManageMasters(it) }
    val name = masterIds.joinToString("-")
    createChild(PermissionRouteSelector("ManageMasters:$name")).apply {
        install(
            createRouteScopedPlugin("RequireAnyManageMasters_$name") {
                on(AuthenticationChecked) { call ->
                    val principal = call.principal<UserSession>() ?: return@on
                    if (permissions.none { principal.permissions.satisfies(it) }) {
                        throw NoPermissionException(permissions.first())
                    }
                }
            },
        )
        block()
    }
}

fun Route.requireMaster(
    masterId: String,
    block: Route.() -> Unit,
) {
    val permission = Permission.ManageMasters(masterId)
    createChild(PermissionRouteSelector("ManageMasters:$masterId")).apply {
        install(
            createRouteScopedPlugin("RequireManageMasters_$masterId") {
                on(AuthenticationChecked) { call ->
                    val principal = call.principal<UserSession>() ?: return@on
                    if (!principal.permissions.satisfies(permission)) {
                        throw NoPermissionException(permission)
                    }
                }
            },
        )
        block()
    }
}
