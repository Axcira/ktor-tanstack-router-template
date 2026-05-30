package net.axcira.features.permissions

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.features.articles.ArticleDTO
import net.axcira.features.articles.CreateArticleInput
import net.axcira.features.users.CreateUserInput
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertReturning
import kotlin.test.Test
import kotlin.test.assertEquals

class PermissionTest {
    @Test
    fun `test permissions`() = test {
        val database: Database by application.dependencies

        // Create test role
        val adminRole = database.dbQuery {
            Role.insertReturning {
                it[name] = "admin"
                it[description] = "Administrator"
                it[permissions] = listOf(Permission.Administrator)
            }.single().let {
                RoleDTO(it[Role.id].value, it[Role.name], it[Role.description], it[Role.permissions])
            }
        }

        // Create test user
        client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("test@example.com", "password", roleId = adminRole.id))
        }.let {
            assertEquals(HttpStatusCode.Created, it.status)
        }

        val staffRole = client.post("/api/roles") {
            contentType(ContentType.Application.Json)
            setBody(
                UpdateRoleInput(
                    "staff", "Staff", listOf(Permission.CreateArticle, Permission.UpdateArticle(false), Permission.DeleteArticle(false))
                )
            )
        }.let {
            assertEquals(HttpStatusCode.Created, it.status)
            it.body<RoleDTO>()
        }
        val userRole = client.post("/api/roles") {
            contentType(ContentType.Application.Json)
            setBody(
                UpdateRoleInput(
                    "user", "User", emptyList()
                )
            )
        }.let {
            assertEquals(HttpStatusCode.Created, it.status)
            it.body<RoleDTO>()
        }

        val article = CreateArticleInput(
            title = "Test Article", description = "This is a test article", body = "", tagList = emptyList()
        )
        // Ensure normal user can't create article
        client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("user@example.com", "password", roleId = userRole.id))
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
            setBody(CreateUserInput("admin@example.com", "password", roleId = adminRole.id))
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
            setBody(CreateUserInput("staff@example.com", "password", roleId = staffRole.id))
        }
        client.patch("/api/articles/${createdArticle.id}") {
            contentType(ContentType.Application.Json)
            setBody(article)
        }.let {
            assertEquals(HttpStatusCode.Forbidden, it.status)
        }
    }
}
