package net.axcira

import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import io.ktor.server.routing.*
import net.axcira.features.articles.ArticleService
import net.axcira.features.auth.AuthService
import net.axcira.features.permissions.PermissionService
import net.axcira.features.users.UserService

val isDevelopment = System.getProperty("io.ktor.development", "false") == "true"

fun Application.main() {
    dependencies {
        provide<AuthService>(::AuthService)
        provide<UserService>(::UserService)
        provide<ArticleService>(::ArticleService)
        provide<PermissionService>(::PermissionService)
    }
    install(IgnoreTrailingSlash)
}

/**
 * /api 以下にルーティングを設定する。
 * 指定されたパスを基にルーティングを作成し、ブロック内で個別のエンドポイントを定義可能。
 *
 * @param route ルートのパス。指定された場合、"/api/<path>" の形でルーティングが設定される。デフォルトはnull。
 * @param block ルーティングブロック。Routeスコープ内でエンドポイントを定義可能。
 */
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
