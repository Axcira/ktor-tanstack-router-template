package net.axcira.features.articles

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.*
import net.axcira.features.auth.UserSession
import net.axcira.features.permissions.*

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

            withPermission(Permission.CreateArticle) {
                /**
                 * Create an article
                 *
                 * OperationID: createArticle
                 */
                post {
                    val article = call.receive<CreateArticleInput>()
                    val userId = call.principal<UserSession>()?.user?.id ?: throw IllegalArgumentException("User not authenticated")
                    val createdArticle = articleService.create(article, userId)
                    call.respond(HttpStatusCode.Created, createdArticle)
                }
            }

            /**
             * Update an article
             *
             * OperationID: updateArticle
             */
            patch("/{id}") {
                val session = call.principal<UserSession>() ?: throw IllegalArgumentException("User not authenticated")
                val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                val scheme = call.receive<UpdateArticleInput>()
                val article = articleService.getById(id) ?: return@patch call.respond(HttpStatusCode.NotFound)

                val requiredPermission = Permission.UpdateArticle(article.userId == session.user.id)
                if (!session.permissions.satisfies(requiredPermission)) throw NoPermissionException(requiredPermission)

                when (val updatedArticle = articleService.update(id, scheme)) {
                    is UpdateResult.Success -> call.respond(HttpStatusCode.OK, updatedArticle.value)
                    is UpdateResult.NotFound -> call.respond(HttpStatusCode.NotFound)
                    is UpdateResult.NotModified -> call.respond(HttpStatusCode.NoContent)
                }
            }

            /**
             * Delete an article
             *
             * OperationID: deleteArticle
             */
            delete("/{id}") {
                val session = call.principal<UserSession>() ?: throw IllegalArgumentException("User not authenticated")
                val id = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("No id found")
                val article = articleService.getById(id) ?: return@delete call.respond(HttpStatusCode.NotFound)

                val requiredPermission = Permission.DeleteArticle(article.userId == session.user.id)
                if (!session.permissions.satisfies(requiredPermission)) throw NoPermissionException(requiredPermission)

                articleService.delete(id)
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}

