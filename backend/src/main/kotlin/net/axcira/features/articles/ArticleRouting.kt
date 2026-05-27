package net.axcira.features.articles

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.Pagination
import net.axcira.apiRouting
import net.axcira.features.auth.UserSession

fun Application.articles() {
    val articleService: ArticleService by dependencies

    apiRouting {
        authenticate {
            route("/articles") {
                get {
                    val pagination = Pagination(
                        call.request.queryParameters["limit"]?.toIntOrNull() ?: 20,
                        call.request.queryParameters["offset"]?.toIntOrNull() ?: 0,
                    )
                    val articles = articleService.get(pagination)
                    call.respond(articles)
                }
                get("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    val article = articleService.getById(id) ?: call.respond(HttpStatusCode.NotFound)
                    call.respond(article)
                }
                post {
                    val article = call.receive<CreateArticleInput>()
                    val userId = call.principal<UserSession>()?.userId ?: throw IllegalArgumentException("User not authenticated")
                    val createdArticle = articleService.create(article, userId)
                    call.respond(createdArticle)
                }
                patch("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    val scheme = call.receive<UpdateArticleInput>()
                    val article = articleService.getById(id) ?: return@patch call.respond(HttpStatusCode.NotFound)
                    if (article.userId != call.principal<UserSession>()?.userId) return@patch call.respond(HttpStatusCode.Forbidden)
                    articleService.update(id, scheme)
                    call.respond(HttpStatusCode.NoContent)
                }
                delete("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                    val article = articleService.getById(id) ?: return@delete call.respond(HttpStatusCode.NotFound)
                    if (article.userId != call.principal<UserSession>()?.userId) return@delete call.respond(HttpStatusCode.Forbidden)
                    articleService.delete(id)
                    call.respond(HttpStatusCode.NoContent)
                }
            }
        }
    }
}

