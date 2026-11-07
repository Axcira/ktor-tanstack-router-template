package net.axcira

import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import io.ktor.server.routing.*
import net.axcira.features.articles.ArticleService
import net.axcira.features.auth.AuthService
import net.axcira.features.health.HealthService
import net.axcira.features.permissions.PermissionService
import net.axcira.features.users.UserService

val isDevelopment = System.getProperty("io.ktor.development", "false") == "true"

fun Application.main() {
    dependencies {
        provide<AuthService>(::AuthService)
        provide<UserService>(::UserService)
        provide<ArticleService>(::ArticleService)
        provide<PermissionService>(::PermissionService)
        provide<HealthService>(::HealthService)
    }
    install(IgnoreTrailingSlash)
}

/**
 * Mounts routes under `/api/v{version}`.
 * Builds the path from [version] and [route], then defines endpoints inside [block].
 *
 * @param route Path appended after the version. When set, the route is `/api/v{version}/<path>`. Defaults to null.
 * @param version API version. Defaults to 1.
 * @param block Routing block. Endpoints are defined in a [Route] scope.
 */
fun Application.apiRouting(
    route: String? = null,
    version: Int = 1,
    block: Route.() -> Unit,
) {
    val path =
        route?.let {
            if (it.startsWith("/")) it else "/$it"
        } ?: ""
    routing {
        route("/api/v$version$path") {
            block()
        }
    }
}
