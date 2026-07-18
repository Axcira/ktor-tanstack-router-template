package net.axcira.features.permissions

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.features.articles.ArticleDTO
import net.axcira.features.articles.CreateArticleInput
import net.axcira.features.auth.LoginRequest
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserService
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
        val userService = UserService(database)

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

        // Create admin and log in
        userService.createUser(CreateUserInput("test@example.com", "password", roleId = adminRole.id))
        client.post("/api/v1/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest("test@example.com", "password"))
        }.let {
            assertEquals(HttpStatusCode.OK, it.status)
        }

        val staffRole = client.post("/api/v1/roles") {
            contentType(ContentType.Application.Json)
            setBody(
                CreateRoleInput(
                    "staff", "Staff", listOf(Permission.CreateArticle, Permission.UpdateArticle(false), Permission.DeleteArticle(false))
                )
            )
        }.let {
            assertEquals(HttpStatusCode.Created, it.status)
            it.body<RoleDTO>()
        }
        val userRole = client.post("/api/v1/roles") {
            contentType(ContentType.Application.Json)
            setBody(
                CreateRoleInput(
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
        userService.createUser(CreateUserInput("user@example.com", "password", roleId = userRole.id))
        client.post("/api/v1/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest("user@example.com", "password"))
        }.let {
            assertEquals(HttpStatusCode.OK, it.status)
        }
        client.post("/api/v1/articles") {
            contentType(ContentType.Application.Json)
            setBody(article)
        }.let {
            assertEquals(HttpStatusCode.Forbidden, it.status)
        }

        // Ensure admin user can create article
        userService.createUser(CreateUserInput("permission-admin@example.com", "password", roleId = adminRole.id))
        client.post("/api/v1/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest("permission-admin@example.com", "password"))
        }.let {
            assertEquals(HttpStatusCode.OK, it.status)
        }
        val createdArticle = client.post("/api/v1/articles") {
            contentType(ContentType.Application.Json)
            setBody(article)
        }.let {
            assertEquals(HttpStatusCode.Created, it.status)
            it.body<ArticleDTO>()
        }

        // Ensure staff user can't edit others' article
        userService.createUser(CreateUserInput("staff@example.com", "password", roleId = staffRole.id))
        client.post("/api/v1/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest("staff@example.com", "password"))
        }.let {
            assertEquals(HttpStatusCode.OK, it.status)
        }
        client.patch("/api/v1/articles/${createdArticle.id}") {
            contentType(ContentType.Application.Json)
            setBody(article)
        }.let {
            assertEquals(HttpStatusCode.Forbidden, it.status)
        }
    }
}
