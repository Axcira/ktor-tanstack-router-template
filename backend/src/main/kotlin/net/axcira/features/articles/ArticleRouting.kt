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

    apiRouting("/articles") {
        authenticate {
            /**
             * List articles
             *
             * OperationID: listArticles
             */
            get {
                val pagination = Pagination(
                    call.request.queryParameters["limit"]?.toIntOrNull() ?: 20,
                    call.request.queryParameters["offset"]?.toIntOrNull() ?: 0,
                )
                val articles = articleService.get(pagination)
                call.respond(articles)
            }

            /**
             * Get a single article
             *
             * OperationID: getArticle
             */
            get("/{id}") {
                val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                val article = articleService.getById(id) ?: return@get call.respond(HttpStatusCode.NotFound)
                call.respond(article)
            }

            /**
             * Create an article
             *
             * OperationID: createArticle
             */
            post {
                val article = call.receive<CreateArticleInput>()
                val userId = call.principal<UserSession>()?.userId ?: throw IllegalArgumentException("User not authenticated")
                val createdArticle = articleService.create(article, userId)
                call.respond(HttpStatusCode.Created, createdArticle)
            }

            /**
             * Update an article
             *
             * OperationID: updateArticle
             */
            patch("/{id}") {
                val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                val scheme = call.receive<UpdateArticleInput>()
                val article = articleService.getById(id) ?: return@patch call.respond(HttpStatusCode.NotFound)
                if (article.userId != call.principal<UserSession>()?.userId) return@patch call.respond(HttpStatusCode.Forbidden)
                val updatedArticle = articleService.update(id, scheme) ?: return@patch call.respond(HttpStatusCode.NotFound)
                call.respond(updatedArticle)
            }

            /**
             * Delete an article
             *
             * OperationID: deleteArticle
             */
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

