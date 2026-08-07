package net.axcira.features.permissions

import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.features.auth.LoginRequest
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserService
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import kotlin.test.Test
import kotlin.test.assertEquals

class CanIRoutingTest {
    @Test
    fun `can-i returns ok when manage articles satisfies create article`() =
        test {
            val database: Database by application.dependencies
            val userService = UserService(database)

            val roleId =
                database.dbQuery {
                    Role.insertAndGetId {
                        it[name] = "can-i-manage-articles"
                        it[description] = "Manage articles role"
                        it[permissions] = listOf(Permission.ManageArticles)
                    }
                }

            userService.createUser(
                CreateUserInput("can-i-manage@example.com", "password", roleId.value),
            )

            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("can-i-manage@example.com", "password"))
                }.let { assertEquals(HttpStatusCode.OK, it.status) }

            val requested: Permission = Permission.CreateArticle
            client
                .post("/api/v1/permissions/can-i") {
                    contentType(ContentType.Application.Json)
                    setBody(requested)
                }.let { assertEquals(HttpStatusCode.OK, it.status) }
        }

    @Test
    fun `can-i returns forbidden when permission is missing`() =
        test {
            val database: Database by application.dependencies
            val userService = UserService(database)

            val roleId =
                database.dbQuery {
                    Role.insertAndGetId {
                        it[name] = "can-i-empty"
                        it[description] = "No permissions"
                        it[permissions] = emptyList()
                    }
                }

            userService.createUser(
                CreateUserInput("can-i-empty@example.com", "password", roleId.value),
            )

            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("can-i-empty@example.com", "password"))
                }.let { assertEquals(HttpStatusCode.OK, it.status) }

            val requested: Permission = Permission.ManageUsers
            client
                .post("/api/v1/permissions/can-i") {
                    contentType(ContentType.Application.Json)
                    setBody(requested)
                }.let { assertEquals(HttpStatusCode.Forbidden, it.status) }
        }

    @Test
    fun `can-i returns ok for administrator bypass`() =
        test {
            val database: Database by application.dependencies
            val userService = UserService(database)

            val roleId =
                database.dbQuery {
                    Role.insertAndGetId {
                        it[name] = "can-i-admin"
                        it[description] = "Administrator"
                        it[permissions] = listOf(Permission.Administrator)
                    }
                }

            userService.createUser(
                CreateUserInput("can-i-admin@example.com", "password", roleId.value),
            )

            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("can-i-admin@example.com", "password"))
                }.let { assertEquals(HttpStatusCode.OK, it.status) }

            val requested: Permission = Permission.UpdateArticle(true)
            client
                .post("/api/v1/permissions/can-i") {
                    contentType(ContentType.Application.Json)
                    setBody(requested)
                }.let { assertEquals(HttpStatusCode.OK, it.status) }
        }
}
