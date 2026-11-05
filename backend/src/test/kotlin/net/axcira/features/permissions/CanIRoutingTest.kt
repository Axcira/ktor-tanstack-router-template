package net.axcira.features.permissions

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.extraClient
import net.axcira.features.auth.LoginRequest
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserService
import net.axcira.login
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

    @Test
    fun `roles list is readable by any authenticated user while mutations require ManageRoles and prevent privilege escalation`() =
        test { reader ->
            val roleManager = extraClient()
            val admin = extraClient()
            try {
                val readerUser = login(reader, "role-reader@example.com", emptyList())
                login(
                    roleManager,
                    "role-manager@example.com",
                    listOf(Permission.ManageRoles, Permission.CreateArticle),
                )
                login(admin, "role-admin@example.com", listOf(Permission.Administrator))

                // Any authenticated user can list roles
                assertEquals(HttpStatusCode.OK, reader.get("/api/v1/roles").status)

                // Unprivileged user cannot read a single role, query permissions, or mutate roles
                assertEquals(HttpStatusCode.Forbidden, reader.get("/api/v1/roles/${readerUser.roleId}").status)
                assertEquals(HttpStatusCode.Forbidden, reader.get("/api/v1/permissions?userid=${readerUser.id}").status)
                assertEquals(
                    HttpStatusCode.Forbidden,
                    reader
                        .post("/api/v1/roles") {
                            contentType(ContentType.Application.Json)
                            setBody(CreateRoleInput("hijack", "hijack", listOf(Permission.Administrator)))
                        }.status,
                )

                // ManageRoles can create a role within their own permissions
                val created =
                    roleManager
                        .post("/api/v1/roles") {
                            contentType(ContentType.Application.Json)
                            setBody(CreateRoleInput("writer", "Writer role", listOf(Permission.CreateArticle)))
                        }.let {
                            assertEquals(HttpStatusCode.Created, it.status)
                            it.body<RoleDTO>()
                        }

                // ManageRoles cannot grant Administrator (which they do not hold) on create or update
                assertEquals(
                    HttpStatusCode.Forbidden,
                    roleManager
                        .post("/api/v1/roles") {
                            contentType(ContentType.Application.Json)
                            setBody(CreateRoleInput("escalate", "Escalate", listOf(Permission.Administrator)))
                        }.status,
                )
                assertEquals(
                    HttpStatusCode.Forbidden,
                    roleManager
                        .patch("/api/v1/roles/${created.id}") {
                            contentType(ContentType.Application.Json)
                            setBody("""{"permissions":[{"type":"Administrator"}]}""")
                        }.status,
                )

                // Administrator can create and delete roles with any permission
                assertEquals(
                    HttpStatusCode.NoContent,
                    roleManager.delete("/api/v1/roles/${created.id}?fallbackRoleId=${readerUser.roleId}").status,
                )
            } finally {
                roleManager.close()
                admin.close()
            }
        }
}
