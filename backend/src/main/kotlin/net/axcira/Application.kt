package net.axcira

import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import io.ktor.server.routing.*
import net.axcira.features.articles.ArticleService
import net.axcira.features.auth.AuthService
import net.axcira.features.permissions.PermissionService
import net.axcira.features.users.UserService

fun Application.main() {
    dependencies {
        provide<AuthService>(::AuthService)
        provide<UserService>(::UserService)
        provide<ArticleService>(::ArticleService)
        provide<PermissionService>(::PermissionService)
    }
    install(IgnoreTrailingSlash)
}

fun Application.apiRouting(block: Route.() -> Unit) {
    routing {
        route("/api") {
            block()
        }
    }
}
