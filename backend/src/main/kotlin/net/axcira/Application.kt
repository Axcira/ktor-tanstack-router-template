package net.axcira

import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import io.ktor.server.routing.*
import net.axcira.features.articles.ArticleService
import net.axcira.features.auth.AuthService
import net.axcira.features.users.UserService

fun Application.main() {
    dependencies {
        provide<AuthService>(::AuthService)
        provide<UserService>(::UserService)
        provide<ArticleService>(::ArticleService)
    }
    install(IgnoreTrailingSlash)
}

fun Application.apiRouting(route: String? = null, block: Route.() -> Unit) {
    val path = route?.let {
        if (it.startsWith("/")) it else "/$it"
    } ?: ""
    routing {
        route("/api${path}") {
            block()
        }
    }
}
