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
                val adminUser = login(admin, "role-admin@example.com", listOf(Permission.Administrator))

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
                        .post("/api/v1/roles") {
                            contentType(ContentType.Application.Json)
                            setBody(CreateRoleInput("mixed-a", "Mixed", listOf(Permission.CreateArticle, Permission.Administrator)))
                        }.status,
                )
                assertEquals(
                    HttpStatusCode.Forbidden,
                    roleManager
                        .post("/api/v1/roles") {
                            contentType(ContentType.Application.Json)
                            setBody(CreateRoleInput("mixed-b", "Mixed", listOf(Permission.Administrator, Permission.CreateArticle)))
                        }.status,
                )
                assertEquals(
                    HttpStatusCode.Forbidden,
                    roleManager
                        .patch("/api/v1/roles/${created.id}") {
                            contentType(ContentType.Application.Json)
                            setBody("{\"permissions\":[{\"type\":\"Administrator\"}]}")
                        }.status,
                )

                // ManageRoles cannot modify or delete an existing higher-privilege role or fallback to it
                val adminRoleBefore = admin.get("/api/v1/roles/${adminUser.roleId}").body<RoleDTO>()
                assertEquals(
                    HttpStatusCode.Forbidden,
                    roleManager
                        .patch("/api/v1/roles/${adminUser.roleId}") {
                            contentType(ContentType.Application.Json)
                            setBody("{\"description\":\"Hijacked description\"}")
                        }.status,
                )
                assertEquals(
                    HttpStatusCode.Forbidden,
                    roleManager.delete("/api/v1/roles/${adminUser.roleId}?fallbackRoleId=${readerUser.roleId}").status,
                )
                assertEquals(
                    HttpStatusCode.Forbidden,
                    roleManager.delete("/api/v1/roles/${created.id}?fallbackRoleId=${adminUser.roleId}").status,
                )
                assertEquals(adminRoleBefore, admin.get("/api/v1/roles/${adminUser.roleId}").body<RoleDTO>())
                assertEquals(HttpStatusCode.OK, roleManager.get("/api/v1/roles/${created.id}").status)

                // Administrator can delete roles with any permission
                assertEquals(
                    HttpStatusCode.NoContent,
                    admin.delete("/api/v1/roles/${created.id}?fallbackRoleId=${readerUser.roleId}").status,
                )
            } finally {
                roleManager.close()
                admin.close()
            }
        }

    @Test
    fun `user creation and update enforce role permission hierarchy`() =
        test { reader ->
            val userManager = extraClient()
            val admin = extraClient()
            try {
                val readerUser = login(reader, "hierarchy-reader@example.com", emptyList())
                login(userManager, "hierarchy-manager@example.com", listOf(Permission.ManageUsers))
                val adminUser = login(admin, "hierarchy-admin@example.com", listOf(Permission.Administrator))

                // ManageUsers cannot create a user with an Administrator role
                assertEquals(
                    HttpStatusCode.Forbidden,
                    userManager
                        .post("/api/v1/users/create") {
                            contentType(ContentType.Application.Json)
                            setBody(CreateUserInput("escalated@example.com", "password", adminUser.roleId!!))
                        }.status,
                )

                // ManageUsers can create a user with an unprivileged role
                assertEquals(
                    HttpStatusCode.Created,
                    userManager
                        .post("/api/v1/users/create") {
                            contentType(ContentType.Application.Json)
                            setBody(CreateUserInput("allowed@example.com", "password", readerUser.roleId!!))
                        }.status,
                )

                // ManageUsers cannot update an existing Administrator user or assign Administrator roleId
                assertEquals(
                    HttpStatusCode.Forbidden,
                    userManager
                        .patch("/api/v1/users/update/${adminUser.id}") {
                            contentType(ContentType.Application.Json)
                            setBody("{\"email\":\"hijacked-admin@example.com\"}")
                        }.status,
                )
                assertEquals(
                    HttpStatusCode.Forbidden,
                    userManager
                        .patch("/api/v1/users/update/${readerUser.id}") {
                            contentType(ContentType.Application.Json)
                            setBody("{\"roleId\":${adminUser.roleId}}")
                        }.status,
                )
            } finally {
                userManager.close()
                admin.close()
            }
        }
}
