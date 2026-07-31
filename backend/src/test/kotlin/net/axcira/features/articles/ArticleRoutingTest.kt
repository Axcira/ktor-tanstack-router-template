package net.axcira.features.articles

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.features.auth.LoginRequest
import net.axcira.features.permissions.Permission
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserService
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals

class ArticleRoutingTest {
    @Test
    fun `test article`() =
        test { client ->
            val database: Database by application.dependencies
            val userService = UserService(database)

            // Create test role
            val role =
                database.dbQuery {
                    Role.insertAndGetId {
                        it[name] = "admin"
                        it[description] = "Administrator"
                        it[permissions] = listOf(Permission.Administrator)
                    }
                }
            // Create test user and log in
            val user = userService.createUser(CreateUserInput("article-admin@example.com", "password", role.value))
            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("article-admin@example.com", "password"))
                }.let {
                    assertEquals(HttpStatusCode.OK, it.status)
                }

            // Create test article
            val createdArticle =
                client
                    .post("/api/v1/articles") {
                        contentType(ContentType.Application.Json)
                        setBody(
                            CreateArticleInput(
                                "Test Article", "This is a test article",
                                body =
                                    """
                                    # Test Article
                                    This is a test article for automatic testing.
                                    """.trimIndent(),
                                tagList = listOf("test", "article", "kotlin"),
                            ),
                        )
                    }.let {
                        assertEquals(HttpStatusCode.Created, it.status)
                        val article = it.body<ArticleDTO>()
                        assert(article.id > 0u)
                        assertEquals(user.id, article.userId)
                        assertEquals(article.title, "Test Article")
                        assertEquals(article.description, "This is a test article")
                        assertContains(article.body, "automatic testing")
                        assertTrue(article.tagList.map { tag -> tag.name }.containsAll(listOf("test", "article", "kotlin")))

                        article
                    }

            // Get created article
            val article = client.get("/api/v1/articles/${createdArticle.id}").body<ArticleDTO>()
            assertEquals(createdArticle, article)

            // Create another article
            client.post("/api/v1/articles") {
                contentType(ContentType.Application.Json)
                setBody(
                    CreateArticleInput(
                        "Another Test Article", "article", "article", emptyList(),
                    ),
                )
            }

            // Get all articles
            val articles = client.get("/api/v1/articles").body<List<ArticleDTO>>()
            assertEquals(2, articles.size)

            // Update article
            client
                .patch("/api/v1/articles/${createdArticle.id}") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """
                        {
                            "title": "Updated Test Article",
                            "description": "This is an updated test article",
                            "body": "This is an updated test article for automatic testing.",
                            "tagList": ["updated", "test", "article", "kotlin"]
                        }
                        """.trimIndent(),
                    )
                }.let {
                    assertEquals(HttpStatusCode.OK, it.status)
                }

            client.get("/api/v1/articles/${createdArticle.id}").let {
                assertEquals(HttpStatusCode.OK, it.status)
                val article = it.body<ArticleDTO>()
                assertContains(article.title, "Updated")
                assertContains(article.description, "updated")
                assertContains(article.body, "automatic testing")
                assertTrue(article.tagList.map { tag -> tag.name }.containsAll(listOf("updated", "test", "article", "kotlin")))
            }

            // Delete article
            assertEquals(HttpStatusCode.NoContent, client.delete("/api/v1/articles/${createdArticle.id}").status)
            assertEquals(HttpStatusCode.NotFound, client.get("/api/v1/articles/${createdArticle.id}").status)
            assertEquals(1, client.get("/api/v1/articles").body<List<ArticleDTO>>().size)
        }
}
