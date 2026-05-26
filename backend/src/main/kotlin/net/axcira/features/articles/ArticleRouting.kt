package net.axcira.features.articles

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import net.axcira.apiRouting
import net.axcira.features.auth.UserSession
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UpdateUserInput

fun Application.articles() {
    val articleService: ArticleService by dependencies

    apiRouting {
        authenticate {
            route("/articles") {
                get {
                    val articles = articleService.getAll()
                    call.respond(articles)
                }

            }
        }
    }
}

