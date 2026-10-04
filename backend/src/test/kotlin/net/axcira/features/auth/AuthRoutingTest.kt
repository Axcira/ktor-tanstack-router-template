package net.axcira.features.auth

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.extraClient
import net.axcira.features.permissions.Permission
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserService
import net.axcira.login
import net.axcira.plugins.ValidationErrorBody
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AuthRoutingTest {
    @Test
    fun `test login via api`() =
        test { client ->
            val database: Database by application.dependencies
            val userService = UserService(database)

            // Create test role
            val roleId =
                database.dbQuery {
                    Role.insertAndGetId {
                        it[name] = "auth-test-role"
                        it[description] = "Auth test role"
                        it[permissions] = listOf(Permission.ManageUsers)
                    }
                }

            // Prepare user (no public registration endpoint)
            userService.createUser(CreateUserInput("api-auth@example.com", "password", roleId.value))

            // Login
            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("api-auth@example.com", "password"))
                }.let {
                    assertEquals(HttpStatusCode.OK, it.status)
                    val session = it.body<UserSession>()
                    assert(session.user.id > 0u)
                }

            // Access to protected resources
            client.get("/api/v1/users/me").let {
                assertEquals(HttpStatusCode.OK, it.status)
            }

            // Logout
            client.post("/api/v1/auth/logout").let {
                assertEquals(HttpStatusCode.NoContent, it.status)
            }

            // Access to protected resources again
            client.get("/api/v1/users/me").let {
                assertEquals(HttpStatusCode.Unauthorized, it.status)
            }
        }

    @Test
    fun `password change requires ChangePassword and manage users does not grant it`() =
        test { client ->
            login(client, "pw-manage@example.com", listOf(Permission.ManageUsers))
            val denied =
                client.post("/api/v1/auth/password") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        ChangePasswordRequest(
                            currentPassword = "password",
                            newPassword = "replacement-1",
                        ),
                    )
                }
            assertEquals(HttpStatusCode.Forbidden, denied.status)

            client.post("/api/v1/auth/logout").let { assertEquals(HttpStatusCode.NoContent, it.status) }
            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("pw-manage@example.com", "password"))
                }.let { assertEquals(HttpStatusCode.OK, it.status) }
        }

    @Test
    fun `password change checks the current password and can drop other sessions`() =
        test { client ->
            val email = "pw-change@example.com"
            login(client, email, listOf(Permission.ChangePassword))
            val other = extraClient()
            try {
                other
                    .post("/api/v1/auth/login") {
                        contentType(ContentType.Application.Json)
                        setBody(LoginRequest(email, "password"))
                    }.let { assertEquals(HttpStatusCode.OK, it.status) }
                assertEquals(HttpStatusCode.OK, other.get("/api/v1/users/me").status)

                val wrong =
                    client.post("/api/v1/auth/password") {
                        contentType(ContentType.Application.Json)
                        setBody(
                            ChangePasswordRequest(
                                currentPassword = "not-the-password",
                                newPassword = "replacement-1",
                            ),
                        )
                    }
                assertEquals(HttpStatusCode.Unauthorized, wrong.status)
                assertEquals(HttpStatusCode.OK, client.get("/api/v1/users/me").status)

                val same =
                    client.post("/api/v1/auth/password") {
                        contentType(ContentType.Application.Json)
                        setBody(
                            ChangePasswordRequest(
                                currentPassword = "password",
                                newPassword = "password",
                            ),
                        )
                    }
                assertEquals(HttpStatusCode.BadRequest, same.status)
                assertTrue(same.body<ValidationErrorBody>().reasons.any { it.contains("differ") })

                val short =
                    client.post("/api/v1/auth/password") {
                        contentType(ContentType.Application.Json)
                        setBody(
                            ChangePasswordRequest(
                                currentPassword = "password",
                                newPassword = "short",
                            ),
                        )
                    }
                assertEquals(HttpStatusCode.BadRequest, short.status)

                val shortCurrent =
                    client.post("/api/v1/auth/password") {
                        contentType(ContentType.Application.Json)
                        setBody(
                            ChangePasswordRequest(
                                currentPassword = "short",
                                newPassword = "replacement-1",
                            ),
                        )
                    }
                assertEquals(HttpStatusCode.BadRequest, shortCurrent.status)

                client
                    .post("/api/v1/auth/password") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"currentPassword":"password","newPassword":"replacement-1"}""")
                    }.let { assertEquals(HttpStatusCode.NoContent, it.status) }
                assertEquals(HttpStatusCode.OK, client.get("/api/v1/users/me").status)
                assertEquals(HttpStatusCode.OK, other.get("/api/v1/users/me").status)

                client
                    .post("/api/v1/auth/password") {
                        contentType(ContentType.Application.Json)
                        setBody(
                            ChangePasswordRequest(
                                currentPassword = "replacement-1",
                                newPassword = "replacement-2",
                                logoutOtherSessions = false,
                            ),
                        )
                    }.let { assertEquals(HttpStatusCode.NoContent, it.status) }
                assertEquals(HttpStatusCode.OK, client.get("/api/v1/users/me").status)
                assertEquals(HttpStatusCode.OK, other.get("/api/v1/users/me").status)

                client
                    .post("/api/v1/auth/password") {
                        contentType(ContentType.Application.Json)
                        setBody(
                            ChangePasswordRequest(
                                currentPassword = "replacement-2",
                                newPassword = "replacement-3",
                                logoutOtherSessions = true,
                            ),
                        )
                    }.let { assertEquals(HttpStatusCode.NoContent, it.status) }
                assertEquals(HttpStatusCode.OK, client.get("/api/v1/users/me").status)
                assertEquals(HttpStatusCode.Unauthorized, other.get("/api/v1/users/me").status)

                client.post("/api/v1/auth/logout").let { assertEquals(HttpStatusCode.NoContent, it.status) }
                client
                    .post("/api/v1/auth/login") {
                        contentType(ContentType.Application.Json)
                        setBody(LoginRequest(email, "password"))
                    }.let { assertEquals(HttpStatusCode.Unauthorized, it.status) }
                client
                    .post("/api/v1/auth/login") {
                        contentType(ContentType.Application.Json)
                        setBody(LoginRequest(email, "replacement-3"))
                    }.let { assertEquals(HttpStatusCode.OK, it.status) }
            } finally {
                other.close()
            }
        }

    @Test
    fun `password change requires a session`() =
        test { client ->
            val response =
                client.post("/api/v1/auth/password") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        ChangePasswordRequest(
                            currentPassword = "password",
                            newPassword = "replacement-1",
                        ),
                    )
                }
            assertEquals(HttpStatusCode.Unauthorized, response.status)
        }

    @Test
    fun `self update cannot change a password`() =
        test { client ->
            login(client, "pw-self@example.com", listOf(Permission.ChangePassword))
            val response =
                client.put("/api/v1/users/me") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"password":"replacement-1"}""")
                }
            assertEquals(HttpStatusCode.BadRequest, response.status)
            assertTrue(response.bodyAsText().contains("password"))

            client.post("/api/v1/auth/logout").let { assertEquals(HttpStatusCode.NoContent, it.status) }
            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("pw-self@example.com", "replacement-1"))
                }.let { assertEquals(HttpStatusCode.Unauthorized, it.status) }
            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("pw-self@example.com", "password"))
                }.let { assertEquals(HttpStatusCode.OK, it.status) }
        }

    @Test
    fun `manage users can force a password change and optionally drop every session`() =
        test { admin ->
            val targetEmail = "pw-target@example.com"
            val target = extraClient()
            val targetOther = extraClient()
            val bystander = extraClient()
            try {
                login(target, targetEmail, listOf(Permission.ChangePassword))
                targetOther
                    .post("/api/v1/auth/login") {
                        contentType(ContentType.Application.Json)
                        setBody(LoginRequest(targetEmail, "password"))
                    }.let { assertEquals(HttpStatusCode.OK, it.status) }
                login(admin, "pw-force-admin@example.com", listOf(Permission.ManageUsers))
                login(bystander, "pw-bystander@example.com", listOf(Permission.ChangePassword))

                val targetId =
                    target
                        .get("/api/v1/users/me")
                        .body<UserSession>()
                        .user.id

                bystander
                    .post("/api/v1/users/$targetId/password") {
                        contentType(ContentType.Application.Json)
                        setBody(ForceChangePasswordRequest(newPassword = "replacement-1"))
                    }.let { assertEquals(HttpStatusCode.Forbidden, it.status) }

                admin
                    .post("/api/v1/users/$targetId/password") {
                        contentType(ContentType.Application.Json)
                        setBody(ForceChangePasswordRequest(newPassword = "short"))
                    }.let { assertEquals(HttpStatusCode.BadRequest, it.status) }

                admin
                    .post("/api/v1/users/$targetId/password") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"newPassword":"replacement-1"}""")
                    }.let { assertEquals(HttpStatusCode.NoContent, it.status) }
                assertEquals(HttpStatusCode.OK, target.get("/api/v1/users/me").status)
                assertEquals(HttpStatusCode.OK, targetOther.get("/api/v1/users/me").status)
                assertEquals(HttpStatusCode.OK, admin.get("/api/v1/users/me").status)

                admin
                    .post("/api/v1/users/$targetId/password") {
                        contentType(ContentType.Application.Json)
                        setBody(
                            ForceChangePasswordRequest(
                                newPassword = "replacement-2",
                                logoutSessions = false,
                            ),
                        )
                    }.let { assertEquals(HttpStatusCode.NoContent, it.status) }
                assertEquals(HttpStatusCode.OK, target.get("/api/v1/users/me").status)
                assertEquals(HttpStatusCode.OK, targetOther.get("/api/v1/users/me").status)

                admin
                    .post("/api/v1/users/$targetId/password") {
                        contentType(ContentType.Application.Json)
                        setBody(
                            ForceChangePasswordRequest(
                                newPassword = "replacement-3",
                                logoutSessions = true,
                            ),
                        )
                    }.let { assertEquals(HttpStatusCode.NoContent, it.status) }
                assertEquals(HttpStatusCode.Unauthorized, target.get("/api/v1/users/me").status)
                assertEquals(HttpStatusCode.Unauthorized, targetOther.get("/api/v1/users/me").status)
                assertEquals(HttpStatusCode.OK, admin.get("/api/v1/users/me").status)

                target
                    .post("/api/v1/auth/login") {
                        contentType(ContentType.Application.Json)
                        setBody(LoginRequest(targetEmail, "password"))
                    }.let { assertEquals(HttpStatusCode.Unauthorized, it.status) }
                target
                    .post("/api/v1/auth/login") {
                        contentType(ContentType.Application.Json)
                        setBody(LoginRequest(targetEmail, "replacement-3"))
                    }.let { assertEquals(HttpStatusCode.OK, it.status) }

                admin
                    .post("/api/v1/users/999999/password") {
                        contentType(ContentType.Application.Json)
                        setBody(ForceChangePasswordRequest(newPassword = "replacement-4"))
                    }.let { assertEquals(HttpStatusCode.NotFound, it.status) }
            } finally {
                target.close()
                targetOther.close()
                bystander.close()
            }
        }

    @Test
    fun `force password change requires a session`() =
        test { client ->
            val response =
                client.post("/api/v1/users/1/password") {
                    contentType(ContentType.Application.Json)
                    setBody(ForceChangePasswordRequest(newPassword = "replacement-1"))
                }
            assertEquals(HttpStatusCode.Unauthorized, response.status)
        }
}
