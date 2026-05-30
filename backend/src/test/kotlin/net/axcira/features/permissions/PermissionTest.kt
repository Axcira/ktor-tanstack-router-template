package net.axcira.features.permissions

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.features.articles.ArticleDTO
import net.axcira.features.articles.CreateArticleInput
import net.axcira.features.users.CreateUserInput
import net.axcira.test
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import kotlin.test.Test
import kotlin.test.assertEquals

class PermissionTest {
    @Test
    fun `test permissions`() = test {
        val db: Database by application.dependencies
        // Create test roles
        val adminRoleId = transaction(db) {
            Role.insert {
                it[name] = "admin"
                it[description] = "Administrator"
                it[permissions] = listOf(
                    Permission.CreateArticle, Permission.UpdateArticle(true), Permission.DeleteArticle(true),
                )
            } get Role.id
        }.value
        val staffRoleId = transaction(db) {
            Role.insert {
                it[name] = "staff"
                it[description] = "Staff member"
                it[permissions] = listOf(Permission.CreateArticle, Permission.UpdateArticle(false), Permission.DeleteArticle(false))
            } get Role.id
        }.value
        val userRoleId = transaction(db) {
            Role.insert {
                it[name] = "user"
                it[description] = "Regular user"
                it[permissions] = emptyList()
            } get Role.id
        }.value

        val article = CreateArticleInput(
            title = "Test Article", description = "This is a test article", body = "", tagList = emptyList()
        )
        // Ensure normal user can't create article
        client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("user@example.com", "password", roleId = userRoleId))
        }
        client.post("/api/articles") {
            contentType(ContentType.Application.Json)
            setBody(article)
        }.let {
            assertEquals(HttpStatusCode.Forbidden, it.status)
        }

        // Ensure admin user can create article
        client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("admin@example.com", "password", roleId = adminRoleId))
        }
        val createdArticle = client.post("/api/articles") {
            contentType(ContentType.Application.Json)
            setBody(article)
        }.let {
            assertEquals(HttpStatusCode.Created, it.status)
            it.body<ArticleDTO>()
        }

        // Ensure staff user can't edit others' article
        client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("staff@example.com", "password", roleId = staffRoleId))
        }
        client.patch("/api/articles/${createdArticle.id}") {
            contentType(ContentType.Application.Json)
            setBody(article)
        }.let {
            assertEquals(HttpStatusCode.Forbidden, it.status)
        }
    }
}
