package net.axcira.features.auth

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.db.SessionsTable
import net.axcira.extraClient
import net.axcira.features.articles.ArticleDTO
import net.axcira.features.articles.CreateArticleInput
import net.axcira.features.permissions.Permission
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserDTO
import net.axcira.features.users.UserService
import net.axcira.login
import net.axcira.plugins.ValidationErrorBody
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
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
                        setBody("{\"currentPassword\":\"password\",\"newPassword\":\"replacement-1\"}")
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
    fun `deleting a user with authored articles cascades cleanly and removes sessions`() =
        test { authorClient ->
            extraClient().use { adminClient ->
                val author = login(authorClient, "cascade-author@example.com", listOf(Permission.CreateArticle))
                login(adminClient, "cascade-admin@example.com", listOf(Permission.ManageUsers))

                val createdArticle =
                    authorClient
                        .post("/api/v1/articles") {
                            contentType(ContentType.Application.Json)
                            setBody(
                                CreateArticleInput(
                                    title = "Author Article",
                                    description = "Will be deleted with author",
                                    body = "Body",
                                    tagList = listOf("cascade", "test"),
                                ),
                            )
                        }.let {
                            assertEquals(HttpStatusCode.Created, it.status)
                            it.body<ArticleDTO>()
                        }

                assertEquals(HttpStatusCode.NoContent, adminClient.delete("/api/v1/users/delete/${author.id}").status)
                assertEquals(HttpStatusCode.NotFound, adminClient.get("/api/v1/articles/${createdArticle.id}").status)
                assertEquals(HttpStatusCode.Unauthorized, authorClient.get("/api/v1/users/me").status)
                val database: Database by application.dependencies
                database.dbQuery {
                    assertEquals(
                        0L,
                        SessionsTable.selectAll().where { SessionsTable.userId eq author.id }.count(),
                    )
                }
            }
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
                        setBody("{\"newPassword\":\"replacement-1\"}")
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
                    }.let {
                        assertEquals(HttpStatusCode.NotFound, it.status)
                        assertEquals("\"User not found\"", it.bodyAsText())
                    }
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

    @Test
    fun `session cookie sets SameSite Lax and Max-Age and rotates session id on re-login`() =
        test { client ->
            val database: Database by application.dependencies
            val userService = UserService(database)
            val roleId =
                database.dbQuery {
                    Role.insertAndGetId {
                        it[name] = "session-rotation-role"
                        it[description] = "Session rotation role"
                        it[permissions] = emptyList()
                    }
                }
            val firstUser =
                userService.createUser(CreateUserInput("first-session@example.com", "password", roleId.value))
            val secondUser =
                userService.createUser(CreateUserInput("second-session@example.com", "password", roleId.value))

            val firstResponse =
                client.post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("first-session@example.com", "password"))
                }
            assertEquals(HttpStatusCode.OK, firstResponse.status)
            val setCookieHeaders = firstResponse.headers.getAll(HttpHeaders.SetCookie).orEmpty()
            assertTrue(setCookieHeaders.any { it.contains("SameSite=Lax", ignoreCase = true) })
            assertTrue(setCookieHeaders.any { it.contains("Max-Age=$SESSION_MAX_AGE_SECONDS", ignoreCase = true) })

            val firstSessionId =
                database.dbQuery {
                    val row =
                        SessionsTable
                            .selectAll()
                            .where { SessionsTable.userId eq firstUser.id }
                            .single()
                    val expiresAt = assertNotNull(row[SessionsTable.expiresAt])
                    assertTrue(expiresAt > System.currentTimeMillis() / 1000)
                    row[SessionsTable.sessionId]
                }

            // Re-login on the same client (sending the existing cookie) as a second user
            val secondResponse =
                client.post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("second-session@example.com", "password"))
                }
            assertEquals(HttpStatusCode.OK, secondResponse.status)

            database.dbQuery {
                assertEquals(
                    0L,
                    SessionsTable.selectAll().where { SessionsTable.sessionId eq firstSessionId }.count(),
                )
                val secondSessionId =
                    SessionsTable
                        .selectAll()
                        .where { SessionsTable.userId eq secondUser.id }
                        .single()[SessionsTable.sessionId]
                assertNotEquals(firstSessionId, secondSessionId)
            }
            assertEquals(
                secondUser.id,
                client
                    .get("/api/v1/users/me")
                    .body<UserSession>()
                    .user.id,
            )
        }

    @Test
    fun `expired session in database is rejected and deleted on read`() =
        test { client ->
            val user = login(client, "expired-session@example.com", emptyList())
            val database: Database by application.dependencies

            database.dbQuery {
                SessionsTable.update({ SessionsTable.userId eq user.id }) {
                    it[expiresAt] = (System.currentTimeMillis() / 1000) - 60
                }
            }

            assertEquals(HttpStatusCode.Unauthorized, client.get("/api/v1/users/me").status)
            database.dbQuery {
                assertEquals(
                    0L,
                    SessionsTable.selectAll().where { SessionsTable.userId eq user.id }.count(),
                )
            }

            // A session row with NULL expires_at is also rejected and deleted on read
            extraClient().use { nullExpiryClient ->
                val nullExpiryUser = login(nullExpiryClient, "null-expiry-session@example.com", emptyList())
                database.dbQuery {
                    SessionsTable.update({ SessionsTable.userId eq nullExpiryUser.id }) {
                        it[expiresAt] = null
                    }
                }
                assertEquals(HttpStatusCode.Unauthorized, nullExpiryClient.get("/api/v1/users/me").status)
                database.dbQuery {
                    assertEquals(
                        0L,
                        SessionsTable.selectAll().where { SessionsTable.userId eq nullExpiryUser.id }.count(),
                    )
                }
            }
        }

    @Test
    fun `PasswordHasher resolvePepper requires SECRET outside development mode`() {
        assertFailsWith<IllegalStateException> {
            PasswordHasher.resolvePepper(secretEnv = null, development = false)
        }
        assertFailsWith<IllegalStateException> {
            PasswordHasher.resolvePepper(secretEnv = "   ", development = false)
        }
        assertEquals("secret", PasswordHasher.resolvePepper(secretEnv = null, development = true))
        assertEquals("custom-secret", PasswordHasher.resolvePepper(secretEnv = "custom-secret", development = false))
    }

    @Test
    fun `getUserById returns user for ManageUsers and 404 when missing`() =
        test { manager ->
            extraClient().use { reader ->
                login(manager, "get-user-manager@example.com", listOf(Permission.ManageUsers))
                val readerUser = login(reader, "get-user-target@example.com", emptyList())

                assertEquals(HttpStatusCode.Forbidden, reader.get("/api/v1/users/${readerUser.id}").status)

                val fetched =
                    manager.get("/api/v1/users/${readerUser.id}").let {
                        assertEquals(HttpStatusCode.OK, it.status)
                        it.body<UserDTO>()
                    }
                assertEquals(readerUser.id, fetched.id)
                assertEquals(readerUser.email, fetched.email)

                assertEquals(HttpStatusCode.NotFound, manager.get("/api/v1/users/999999").status)
                assertEquals(HttpStatusCode.BadRequest, manager.get("/api/v1/users/not-a-number").status)
            }
        }
}
