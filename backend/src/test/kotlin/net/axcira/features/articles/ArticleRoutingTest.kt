package net.axcira.features.articles

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserDTO
import net.axcira.test
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals

class ArticleRoutingTest {
    @Test
    fun `test article`() = test { client ->
        // Create test user
        val user = client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("admin@example.com", "password"))
        }.body<UserDTO>()

        // Create test article
        val createdArticle = client.post("/api/articles") {
            contentType(ContentType.Application.Json)
            setBody(
                CreateArticleInput(
                    "Test Article", "This is a test article", body = """
                        # Test Article
                        This is a test article for automatic testing.
                    """.trimIndent(), tagList = listOf("test", "article", "kotlin")
                )
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
        val article = client.get("/api/articles/${createdArticle.id}").body<ArticleDTO>()
        assertEquals(createdArticle, article)

        // Create another article
        client.post("/api/articles") {
            contentType(ContentType.Application.Json)
            setBody(
                CreateArticleInput(
                    "Another Test Article", "article", "article", emptyList()
                )
            )
        }

        // Get all articles
        val articles = client.get("/api/articles").body<List<ArticleDTO>>()
        assertEquals(2, articles.size)

        // Update article
        client.patch("/api/articles/${createdArticle.id}") {
            contentType(ContentType.Application.Json)
            setBody(
                UpdateArticleInput(
                    "Updated Test Article", "This is an updated test article", body = """
                        # Updated Test Article
                        This is an updated test article for automatic testing.
                    """.trimIndent(), tagList = listOf("updated", "test", "article", "kotlin")
                )
            )
        }.let {
            assertEquals(HttpStatusCode.OK, it.status)
        }

        client.get("/api/articles/${createdArticle.id}").let {
            assertEquals(HttpStatusCode.OK, it.status)
            val article = it.body<ArticleDTO>()
            assertContains(article.title, "Updated")
            assertContains(article.description, "updated")
            assertContains(article.body, "automatic testing")
            assertTrue(article.tagList.map { tag -> tag.name }.containsAll(listOf("updated", "test", "article", "kotlin")))
        }

        // Delete article
        assertEquals(HttpStatusCode.NoContent, client.delete("/api/articles/${createdArticle.id}").status)
        assertEquals(HttpStatusCode.NotFound, client.get("/api/articles/${createdArticle.id}").status)
        assertEquals(1, client.get("/api/articles").body<List<ArticleDTO>>().size)
    }
}
