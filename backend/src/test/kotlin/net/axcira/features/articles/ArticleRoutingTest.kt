package net.axcira.features.articles

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.assertStatus
import net.axcira.db.Roles
import net.axcira.extraClient
import net.axcira.features.auth.LoginRequest
import net.axcira.features.permissions.Permission
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserService
import net.axcira.login
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.junit.jupiter.api.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ArticleRoutingTest {
    @Test
    fun `test article`() =
        test { client ->
            val database: Database by application.dependencies
            val userService = UserService(database)

            // Create test role
            val role =
                database.dbQuery {
                    Roles.insertAndGetId {
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
                }.assertStatus(HttpStatusCode.OK)

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
                    }.assertStatus(HttpStatusCode.Created)
                    .body<ArticleDTO>()
                    .also { article ->
                        assertTrue(article.id > 0u)
                        assertEquals(user.id, article.userId)
                        assertEquals("Test Article", article.title)
                        assertEquals("This is a test article", article.description)
                        assertContains(article.body, "automatic testing")
                        assertTrue(article.tagList.map { tag -> tag.name }.containsAll(listOf("test", "article", "kotlin")))
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
                }.assertStatus(HttpStatusCode.OK)

            client
                .get("/api/v1/articles/${createdArticle.id}")
                .assertStatus(HttpStatusCode.OK)
                .body<ArticleDTO>()
                .also { article ->
                    assertContains(article.title, "Updated")
                    assertContains(article.description, "updated")
                    assertContains(article.body, "automatic testing")
                    assertTrue(article.tagList.map { tag -> tag.name }.containsAll(listOf("updated", "test", "article", "kotlin")))
                }

            // Delete article
            client.delete("/api/v1/articles/${createdArticle.id}").assertStatus(HttpStatusCode.NoContent)
            client.get("/api/v1/articles/${createdArticle.id}").assertStatus(HttpStatusCode.NotFound)
            assertEquals(1, client.get("/api/v1/articles").body<List<ArticleDTO>>().size)
        }

    @Test
    fun `article creation requires CreateArticle and UpdateArticle false rejects editing others articles`() =
        test { authorClient ->
            val readerClient = extraClient()
            val staffClient = extraClient()
            try {
                login(authorClient, "article-owner@example.com", listOf(Permission.CreateArticle))
                login(readerClient, "article-reader@example.com", emptyList())
                login(staffClient, "article-staff@example.com", listOf(Permission.UpdateArticle(false)))

                val input = CreateArticleInput("Owner Article", "Desc", "Body", emptyList())

                readerClient
                    .post("/api/v1/articles") {
                        contentType(ContentType.Application.Json)
                        setBody(input)
                    }.assertStatus(HttpStatusCode.Forbidden)

                val created =
                    authorClient
                        .post("/api/v1/articles") {
                            contentType(ContentType.Application.Json)
                            setBody(input)
                        }.body<ArticleDTO>()

                staffClient
                    .patch("/api/v1/articles/${created.id}") {
                        contentType(ContentType.Application.Json)
                        setBody("{\"title\":\"Hijacked\"}")
                    }.assertStatus(HttpStatusCode.Forbidden)
            } finally {
                readerClient.close()
                staffClient.close()
            }
        }
}
