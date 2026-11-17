package net.axcira.features.auth

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.plugins.di.dependencies
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import net.axcira.assertStatus
import net.axcira.db.AccountSessions
import net.axcira.db.Roles
import net.axcira.db.Sessions
import net.axcira.extraClient
import net.axcira.features.permissions.Permission
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserDTO
import net.axcira.features.users.UserService
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.TransactionManager
import org.jetbrains.exposed.v1.jdbc.update
import org.junit.jupiter.api.Test
import java.net.URLDecoder
import java.net.URLEncoder
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class AccountSessionTest {
    @Test
    fun `login cookie is only the device session id and selects that account by default`() =
        test { client ->
            val user = createUser("cookie-only@example.com", emptyList())
            val response = login(client, user.email)
            val body = response.body<LoginResponse>()
            assertEquals(0, body.accountIndex)
            assertEquals(user.id, body.user.id)

            val setCookie =
                response.headers
                    .getAll(HttpHeaders.SetCookie)
                    .orEmpty()
                    .single { it.startsWith("user_session=") }
            assertTrue(setCookie.contains("HttpOnly", ignoreCase = true))
            assertTrue(setCookie.contains("SameSite=Lax", ignoreCase = true))
            assertTrue(setCookie.contains("Max-Age=$SESSION_MAX_AGE_SECONDS", ignoreCase = true))
            val cookieValue = URLDecoder.decode(setCookie.substringAfter("user_session=").substringBefore(";"), Charsets.UTF_8)
            assertFalse(cookieValue.contains("@"))
            assertFalse(cookieValue.contains("cookie-only"))

            val database: Database by application.dependencies
            database.dbQuery {
                val row = Sessions.selectAll().where { Sessions.sessionId eq cookieValue }.single()
                assertEquals(user.id, row[Sessions.userId])
                val accounts =
                    AccountSessions
                        .selectAll()
                        .where { (AccountSessions.deviceSessionId eq cookieValue) and AccountSessions.revokedAt.isNull() }
                        .toList()
                assertEquals(1, accounts.size)
                assertEquals(0, accounts.single()[AccountSessions.accountIndex])
                assertEquals(user.id, accounts.single()[AccountSessions.userId])
            }

            assertEquals(
                user.id,
                client
                    .get("/api/v1/users/me")
                    .assertStatus(HttpStatusCode.OK)
                    .body<UserSession>()
                    .user.id,
            )
        }

    @Test
    fun `add account keeps indices stable, rotates the device session id, and the newest login is the default`() =
        test { client ->
            val first = createUser("index-a@example.com", listOf(Permission.Administrator))
            val second = createUser("index-b@example.com", emptyList())
            val firstLogin = login(client, first.email)
            val firstCookie = cookieValue(firstLogin)

            val secondLogin = login(client, second.email, addAccount = true)
            assertEquals(1, secondLogin.body<LoginResponse>().accountIndex)
            val secondCookie = cookieValue(secondLogin)
            assertNotEquals(firstCookie, secondCookie)

            val database: Database by application.dependencies
            database.dbQuery {
                assertEquals(0L, Sessions.selectAll().where { Sessions.sessionId eq firstCookie }.count())
                assertEquals(1L, Sessions.selectAll().count())
                assertEquals(
                    2L,
                    AccountSessions
                        .selectAll()
                        .where { (AccountSessions.deviceSessionId eq secondCookie) and AccountSessions.revokedAt.isNull() }
                        .count(),
                )
            }

            assertEquals(second.id, client.me().user.id)
            assertEquals(first.id, client.me(0).user.id)
            assertEquals(second.id, client.me(1).user.id)

            val listed = client.get("/api/v1/accounts").assertStatus(HttpStatusCode.OK).body<List<AccountSummary>>()
            assertEquals(listOf(0, 1), listed.map { it.index })
            assertEquals("index-a", listed.single { it.index == 0 }.displayName)
            assertEquals(first.email, listed.single { it.index == 0 }.email)
            assertEquals(false, listed.single { it.index == 0 }.isDefault)
            assertEquals(true, listed.single { it.index == 1 }.isDefault)
            assertTrue(listed.all { it.avatarUrl == null })
            assertFalse(client.get("/api/v1/accounts").bodyAsText().contains(secondCookie))
        }

    @Test
    fun `explicit account index enforces that account's permissions`() =
        test { client ->
            val admin = createUser("perm-admin@example.com", listOf(Permission.Administrator))
            val reader = createUser("perm-reader@example.com", emptyList())
            login(client, admin.email)
            val added = login(client, reader.email, addAccount = true)
            assertEquals(1, added.body<LoginResponse>().accountIndex)

            client.get("/api/v1/users") { header(ACCOUNT_INDEX_HEADER, "0") }.assertStatus(HttpStatusCode.OK)
            client.get("/api/v1/users") { header(ACCOUNT_INDEX_HEADER, "1") }.assertStatus(HttpStatusCode.Forbidden)
            client.get("/api/v1/users").assertStatus(HttpStatusCode.Forbidden)
        }

    @Test
    fun `invalid and expired indexes are distinguishable and a missing header uses a valid default`() =
        test { client ->
            val first = createUser("invalid-a@example.com", emptyList())
            val second = createUser("invalid-b@example.com", emptyList())
            login(client, first.email)
            login(client, second.email, addAccount = true)

            val missing =
                client.get("/api/v1/users/me") { header(ACCOUNT_INDEX_HEADER, "4") }
            missing.assertStatus(HttpStatusCode.Unauthorized)
            assertEquals(ACCOUNT_INDEX_INVALID, missing.body<ErrorResponse>().code)

            val garbage =
                client.get("/api/v1/users/me") { header(ACCOUNT_INDEX_HEADER, "nope") }
            garbage.assertStatus(HttpStatusCode.Unauthorized)
            assertEquals(ACCOUNT_INDEX_INVALID, garbage.body<ErrorResponse>().code)

            val database: Database by application.dependencies
            database.dbQuery {
                AccountSessions.update({ AccountSessions.userId eq second.id }) {
                    it[expiresAt] = System.currentTimeMillis() - 1_000
                }
            }
            val expired = client.get("/api/v1/users/me") { header(ACCOUNT_INDEX_HEADER, "1") }
            expired.assertStatus(HttpStatusCode.Unauthorized)
            assertEquals(ACCOUNT_REAUTH_REQUIRED, expired.body<ErrorResponse>().code)

            assertEquals(first.id, client.me().user.id)
            assertEquals(first.id, client.me(0).user.id)
        }

    @Test
    fun `per-account logout frees the lowest index and logout-all destroys the device session`() =
        test { client ->
            val first = createUser("slot-a@example.com", emptyList())
            val second = createUser("slot-b@example.com", emptyList())
            val third = createUser("slot-c@example.com", emptyList())
            login(client, first.email)
            login(client, second.email, addAccount = true)
            login(client, third.email, addAccount = true)

            client.post("/api/v1/accounts/0/logout").assertStatus(HttpStatusCode.NoContent)
            val gone = client.get("/api/v1/users/me") { header(ACCOUNT_INDEX_HEADER, "0") }
            gone.assertStatus(HttpStatusCode.Unauthorized)
            assertEquals(ACCOUNT_INDEX_INVALID, gone.body<ErrorResponse>().code)
            assertEquals(second.id, client.me(1).user.id)
            assertEquals(third.id, client.me(2).user.id)
            assertEquals(third.id, client.me().user.id)

            val reused = login(client, first.email, addAccount = true)
            assertEquals(0, reused.body<LoginResponse>().accountIndex)
            // The missing-header default is the account just signed in. An explicit index
            // that differs from that default becomes the new default, so check it first.
            assertEquals(first.id, client.me().user.id)
            assertEquals(second.id, client.me(1).user.id)

            client.post("/api/v1/accounts/9/logout").assertStatus(HttpStatusCode.NotFound)
            client.post("/api/v1/accounts/nope/logout").assertStatus(HttpStatusCode.BadRequest)

            client.get("/api/v1/users/me").assertStatus(HttpStatusCode.OK)
            client.post("/api/v1/auth/logout").assertStatus(HttpStatusCode.NoContent)
            client.get("/api/v1/users/me").assertStatus(HttpStatusCode.Unauthorized)
            client.get("/api/v1/accounts").assertStatus(HttpStatusCode.Unauthorized)

            val database: Database by application.dependencies
            database.dbQuery {
                assertEquals(0L, Sessions.selectAll().count())
                assertEquals(0L, AccountSessions.selectAll().where { AccountSessions.revokedAt.isNull() }.count())
            }
        }

    @Test
    fun `an eleventh account is rejected and signing in again reuses the existing index`() =
        test { client ->
            val users = (0 until MAX_ACCOUNTS_PER_DEVICE).map { createUser("limit-$it@example.com", emptyList()) }
            login(client, users.first().email)
            users.drop(1).forEachIndexed { offset, user ->
                val added = login(client, user.email, addAccount = true)
                assertEquals(offset + 1, added.body<LoginResponse>().accountIndex)
            }
            val eleventh = createUser("limit-extra@example.com", emptyList())
            val rejected =
                client.post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest(eleventh.email, "password", addAccount = true))
                }
            rejected.assertStatus(HttpStatusCode.Conflict)
            assertEquals(ACCOUNT_LIMIT_REACHED, rejected.body<ErrorResponse>().code)
            assertEquals(users.last().id, client.me().user.id)
            assertEquals(MAX_ACCOUNTS_PER_DEVICE, client.get("/api/v1/accounts").body<List<AccountSummary>>().size)

            val again = login(client, users[3].email, addAccount = true)
            assertEquals(3, again.body<LoginResponse>().accountIndex)
            assertEquals(MAX_ACCOUNTS_PER_DEVICE, client.get("/api/v1/accounts").body<List<AccountSummary>>().size)
            assertEquals(users[3].id, client.me().user.id)
        }

    @Test
    fun `replace login drops other accounts and password logout does not remove the other account on this device`() =
        test { client ->
            val keeper = createUser("keep-other@example.com", listOf(Permission.ChangePassword))
            val guest = createUser("guest-other@example.com", emptyList())
            login(client, keeper.email)
            login(client, guest.email, addAccount = true)

            extraClient().use { otherDevice ->
                login(otherDevice, keeper.email)
                otherDevice.get("/api/v1/users/me").assertStatus(HttpStatusCode.OK)

                client
                    .post("/api/v1/auth/password") {
                        contentType(ContentType.Application.Json)
                        header(ACCOUNT_INDEX_HEADER, "0")
                        setBody(
                            ChangePasswordRequest(
                                currentPassword = "password",
                                newPassword = "replacement-1",
                                logoutOtherSessions = true,
                            ),
                        )
                    }.assertStatus(HttpStatusCode.NoContent)

                assertEquals(keeper.id, client.me(0).user.id)
                assertEquals(guest.id, client.me(1).user.id)
                otherDevice.get("/api/v1/users/me").assertStatus(HttpStatusCode.Unauthorized)
            }

            val replacement = createUser("replaced@example.com", emptyList())
            val replaced = login(client, replacement.email, addAccount = false)
            assertEquals(0, replaced.body<LoginResponse>().accountIndex)
            assertEquals(replacement.id, client.me().user.id)
            val stale = client.get("/api/v1/users/me") { header(ACCOUNT_INDEX_HEADER, "1") }
            stale.assertStatus(HttpStatusCode.Unauthorized)
            assertEquals(ACCOUNT_INDEX_INVALID, stale.body<ErrorResponse>().code)
            assertEquals(1, client.get("/api/v1/accounts").body<List<AccountSummary>>().size)
        }

    @Test
    fun `deleting one user on a device leaves the other account signed in`() =
        test { client ->
            val admin = createUser("delete-admin@example.com", listOf(Permission.ManageUsers))
            val victim = createUser("delete-victim@example.com", emptyList())
            val survivor = createUser("delete-survivor@example.com", emptyList())
            login(client, admin.email)
            login(client, victim.email, addAccount = true)
            login(client, survivor.email, addAccount = true)

            client.deleteUser(victim.id)
            val removed = client.get("/api/v1/users/me") { header(ACCOUNT_INDEX_HEADER, "1") }
            removed.assertStatus(HttpStatusCode.Unauthorized)
            assertEquals(ACCOUNT_INDEX_INVALID, removed.body<ErrorResponse>().code)
            assertEquals(survivor.id, client.me(2).user.id)
            assertEquals(admin.id, client.me(0).user.id)
        }

    @Test
    fun `adding an account to a device session that is already gone does not start a second session`() =
        test { client ->
            val user = createUser("superseded@example.com", emptyList())
            val first = login(client, user.email)
            val cookie = cookieValue(first)
            val database: Database by application.dependencies
            database.dbQuery {
                AccountSessions.deleteWhere { AccountSessions.deviceSessionId eq cookie }
                Sessions.deleteWhere { Sessions.sessionId eq cookie }
            }

            val again =
                client.post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest(user.email, "password", addAccount = true))
                }
            again.assertStatus(HttpStatusCode.Conflict)
            assertEquals(SESSION_SUPERSEDED, again.body<ErrorResponse>().code)
            client.get("/api/v1/users/me").assertStatus(HttpStatusCode.Unauthorized)
            database.dbQuery {
                assertEquals(0L, Sessions.selectAll().count())
            }

            val replaced = login(client, user.email)
            assertEquals(0, replaced.body<LoginResponse>().accountIndex)
            assertEquals(user.id, client.me().user.id)
            database.dbQuery {
                assertEquals(1L, Sessions.selectAll().count())
            }
        }

    @Test
    fun `a password logout keeps the slot and asks that account to sign in again`() =
        test { client ->
            val keeper = createUser("reauth-keep@example.com", listOf(Permission.Administrator))
            val locked = createUser("reauth-locked@example.com", emptyList())
            login(client, keeper.email)
            login(client, locked.email, addAccount = true)

            client
                .post("/api/v1/users/${locked.id}/password") {
                    contentType(ContentType.Application.Json)
                    header(ACCOUNT_INDEX_HEADER, "0")
                    setBody(ForceChangePasswordRequest(newPassword = "replacement-1", logoutSessions = true))
                }.assertStatus(HttpStatusCode.NoContent)

            val listed = client.get("/api/v1/accounts").body<List<AccountSummary>>()
            val lockedSummary = listed.single { it.email == locked.email }
            assertEquals(1, lockedSummary.index)
            assertEquals("reauth-locked", lockedSummary.displayName)
            assertTrue(lockedSummary.requiresReauth)
            assertFalse(lockedSummary.isDefault)
            assertEquals(keeper.email, listed.single { it.isDefault }.email)

            val reauth = client.get("/api/v1/users/me") { header(ACCOUNT_INDEX_HEADER, "1") }
            reauth.assertStatus(HttpStatusCode.Unauthorized)
            assertEquals(ACCOUNT_REAUTH_REQUIRED, reauth.body<ErrorResponse>().code)
            val missing = client.get("/api/v1/users/me") { header(ACCOUNT_INDEX_HEADER, "8") }
            missing.assertStatus(HttpStatusCode.Unauthorized)
            assertEquals(ACCOUNT_INDEX_INVALID, missing.body<ErrorResponse>().code)
            assertEquals(keeper.id, client.me().user.id)

            val again =
                client.post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest(locked.email, "replacement-1", addAccount = true))
                }
            again.assertStatus(HttpStatusCode.OK)
            assertEquals(1, again.body<LoginResponse>().accountIndex)
            val restored = client.get("/api/v1/accounts").body<List<AccountSummary>>().single { it.index == 1 }
            assertFalse(restored.requiresReauth)
            assertEquals(locked.id, client.me(1).user.id)

            client
                .post("/api/v1/users/${locked.id}/password") {
                    contentType(ContentType.Application.Json)
                    header(ACCOUNT_INDEX_HEADER, "0")
                    setBody(ForceChangePasswordRequest(newPassword = "replacement-2", logoutSessions = true))
                }.assertStatus(HttpStatusCode.NoContent)
            client.post("/api/v1/accounts/1/logout").assertStatus(HttpStatusCode.NoContent)
            assertTrue(client.get("/api/v1/accounts").body<List<AccountSummary>>().none { it.index == 1 })
            val gone = client.get("/api/v1/users/me") { header(ACCOUNT_INDEX_HEADER, "1") }
            gone.assertStatus(HttpStatusCode.Unauthorized)
            assertEquals(ACCOUNT_INDEX_INVALID, gone.body<ErrorResponse>().code)
        }

    @Test
    fun `two tabs adding accounts from one device session cannot both claim the free index`() =
        test { client ->
            val first = createUser("concurrent-a@example.com", emptyList())
            val second = createUser("concurrent-b@example.com", emptyList())
            val third = createUser("concurrent-c@example.com", emptyList())
            val cookie = cookieValue(login(client, first.email))
            val left = extraClient()
            val right = extraClient()
            try {
                val (leftResponse, rightResponse) =
                    coroutineScope {
                        val leftLogin =
                            async {
                                left.post("/api/v1/auth/login") {
                                    header(HttpHeaders.Cookie, sessionCookie(cookie))
                                    contentType(ContentType.Application.Json)
                                    setBody(LoginRequest(second.email, "password", addAccount = true))
                                }
                            }
                        val rightLogin =
                            async {
                                right.post("/api/v1/auth/login") {
                                    header(HttpHeaders.Cookie, sessionCookie(cookie))
                                    contentType(ContentType.Application.Json)
                                    setBody(LoginRequest(third.email, "password", addAccount = true))
                                }
                            }
                        leftLogin.await() to rightLogin.await()
                    }
                val responses = listOf(leftResponse, rightResponse)
                val won = responses.single { it.status == HttpStatusCode.OK }
                val lost = responses.single { it.status == HttpStatusCode.Conflict }
                assertEquals(1, won.body<LoginResponse>().accountIndex)
                assertEquals(SESSION_SUPERSEDED, lost.body<ErrorResponse>().code)
                val winnerId = if (won === leftResponse) second.id else third.id
                val loserId = if (won === leftResponse) third.id else second.id
                val database: Database by application.dependencies
                database.dbQuery {
                    assertEquals(0L, Sessions.selectAll().where { Sessions.sessionId eq cookie }.count())
                    assertEquals(1L, Sessions.selectAll().count())
                    val active =
                        AccountSessions
                            .selectAll()
                            .where { AccountSessions.revokedAt.isNull() }
                            .map { it[AccountSessions.userId] }
                    assertEquals(setOf(first.id, winnerId), active.toSet())
                    assertFalse(loserId in active)
                }
            } finally {
                left.close()
                right.close()
            }
        }

    @Test
    fun `a concurrent password logout is not undone by adding an account`() =
        test { client ->
            val admin = createUser("concurrent-admin@example.com", listOf(Permission.ManageUsers))
            val victim = createUser("concurrent-victim@example.com", emptyList())
            val added = createUser("concurrent-added@example.com", emptyList())
            login(client, admin.email)
            val sharedCookie = cookieValue(login(client, victim.email, addAccount = true))
            val adminDevice = extraClient()
            val adder = extraClient()
            try {
                login(adminDevice, admin.email)
                val (addedResponse, revokedResponse) =
                    coroutineScope {
                        val adding =
                            async {
                                adder.post("/api/v1/auth/login") {
                                    header(HttpHeaders.Cookie, sessionCookie(sharedCookie))
                                    contentType(ContentType.Application.Json)
                                    setBody(LoginRequest(added.email, "password", addAccount = true))
                                }
                            }
                        val revoking =
                            async {
                                adminDevice.post("/api/v1/users/${victim.id}/password") {
                                    contentType(ContentType.Application.Json)
                                    setBody(
                                        ForceChangePasswordRequest(
                                            newPassword = "replacement-1",
                                            logoutSessions = true,
                                        ),
                                    )
                                }
                            }
                        adding.await() to revoking.await()
                    }
                addedResponse.assertStatus(HttpStatusCode.OK)
                revokedResponse.assertStatus(HttpStatusCode.NoContent)
                val database: Database by application.dependencies
                database.dbQuery {
                    assertEquals(
                        1L,
                        AccountSessions
                            .selectAll()
                            .where {
                                (AccountSessions.userId eq victim.id) and
                                    AccountSessions.revokedAt.isNull() and
                                    (AccountSessions.requiresReauth eq true)
                            }.count(),
                    )
                    assertEquals(
                        0L,
                        AccountSessions
                            .selectAll()
                            .where {
                                (AccountSessions.userId eq victim.id) and
                                    AccountSessions.revokedAt.isNull() and
                                    (AccountSessions.requiresReauth eq false)
                            }.count(),
                    )
                    assertEquals(
                        1L,
                        AccountSessions
                            .selectAll()
                            .where { (AccountSessions.userId eq added.id) and AccountSessions.revokedAt.isNull() }
                            .count(),
                    )
                }
                adder
                    .post("/api/v1/auth/login") {
                        contentType(ContentType.Application.Json)
                        setBody(LoginRequest(victim.email, "password"))
                    }.assertStatus(HttpStatusCode.Unauthorized)
            } finally {
                adminDevice.close()
                adder.close()
            }
        }

    @Test
    fun `a second login cannot publish a snapshot taken before revocation`() =
        test { client ->
            val keeper = createUser("ordered-keeper@example.com", listOf(Permission.ManageUsers))
            val victim = createUser("ordered-victim@example.com", emptyList())
            val firstAdded = createUser("ordered-added-1@example.com", emptyList())
            val secondAdded = createUser("ordered-added-2@example.com", emptyList())
            login(client, keeper.email)
            val originalCookie = cookieValue(login(client, victim.email, addAccount = true))
            val adminDevice = extraClient()
            val adder = extraClient()
            val revokeEntered = CountDownLatch(1)
            val resumeRevoke = CountDownLatch(1)
            val secondSnapshotted = CountDownLatch(1)
            val resumeSecondLogin = CountDownLatch(1)
            System.getProperties()[AuthService.PAUSE_BEFORE_REVOKE] =
                arrayOf(revokeEntered, resumeRevoke)
            try {
                login(adminDevice, keeper.email)
                coroutineScope {
                    val revoking =
                        async {
                            adminDevice.post("/api/v1/users/${victim.id}/password") {
                                contentType(ContentType.Application.Json)
                                setBody(
                                    ForceChangePasswordRequest(
                                        newPassword = "replacement-ordered",
                                        logoutSessions = true,
                                    ),
                                )
                            }
                        }
                    assertTrue(
                        withContext(Dispatchers.IO) { revokeEntered.await(15, TimeUnit.SECONDS) },
                    )
                    val firstLogin =
                        adder.post("/api/v1/auth/login") {
                            header(HttpHeaders.Cookie, sessionCookie(originalCookie))
                            contentType(ContentType.Application.Json)
                            setBody(LoginRequest(firstAdded.email, "password", addAccount = true))
                        }
                    firstLogin.assertStatus(HttpStatusCode.OK)
                    val rotatedCookie = cookieValue(firstLogin)
                    System.getProperties()[AuthService.PAUSE_AFTER_SNAPSHOT] =
                        arrayOf(secondSnapshotted, resumeSecondLogin)
                    val secondLogin =
                        async {
                            adder.post("/api/v1/auth/login") {
                                header(HttpHeaders.Cookie, sessionCookie(rotatedCookie))
                                contentType(ContentType.Application.Json)
                                setBody(LoginRequest(secondAdded.email, "password", addAccount = true))
                            }
                        }
                    assertTrue(
                        withContext(Dispatchers.IO) {
                            secondSnapshotted.await(15, TimeUnit.SECONDS)
                        },
                    )
                    resumeRevoke.countDown()
                    withTimeout(10_000) {
                        while (ungrantedLockCount() == 0L) {
                            check(!revoking.isCompleted) {
                                "revocation finished before the second login released its account locks"
                            }
                            delay(20)
                        }
                    }
                    resumeSecondLogin.countDown()
                    secondLogin.await().assertStatus(HttpStatusCode.OK)
                    revoking.await().assertStatus(HttpStatusCode.NoContent)
                }
                val database: Database by application.dependencies
                database.dbQuery {
                    assertEquals(
                        1L,
                        AccountSessions
                            .selectAll()
                            .where {
                                (AccountSessions.userId eq victim.id) and
                                    AccountSessions.revokedAt.isNull() and
                                    (AccountSessions.requiresReauth eq true)
                            }.count(),
                    )
                    assertEquals(
                        0L,
                        AccountSessions
                            .selectAll()
                            .where {
                                (AccountSessions.userId eq victim.id) and
                                    AccountSessions.revokedAt.isNull() and
                                    (AccountSessions.requiresReauth eq false)
                            }.count(),
                    )
                }
            } finally {
                resumeRevoke.countDown()
                resumeSecondLogin.countDown()
                System.getProperties().remove(AuthService.PAUSE_BEFORE_REVOKE)
                System.getProperties().remove(AuthService.PAUSE_AFTER_SNAPSHOT)
                adminDevice.close()
                adder.close()
            }
        }

    private suspend fun net.axcira.SharedTestContext.ungrantedLockCount(): Long {
        val database: Database by application.dependencies
        return database.dbQuery {
            TransactionManager.current().exec(
                "SELECT COUNT(*) FROM pg_locks WHERE NOT granted",
            ) { rs ->
                rs.next()
                rs.getLong(1)
            } ?: 0L
        }
    }

    private suspend fun net.axcira.SharedTestContext.createUser(
        email: String,
        permissions: List<Permission>,
    ): UserDTO {
        val database: Database by application.dependencies
        val userService = UserService(database)
        val roleId =
            database.dbQuery {
                Roles.insertAndGetId {
                    it[name] = email
                    it[description] = email
                    it[Roles.permissions] = permissions
                }
            }
        return userService.createUser(CreateUserInput(email, "password", roleId.value))
    }

    private suspend fun login(
        client: HttpClient,
        email: String,
        addAccount: Boolean = false,
    ): HttpResponse =
        client
            .post("/api/v1/auth/login") {
                contentType(ContentType.Application.Json)
                setBody(LoginRequest(email, "password", addAccount))
            }.assertStatus(HttpStatusCode.OK)

    private suspend fun HttpClient.me(index: Int? = null): UserSession =
        get("/api/v1/users/me") {
            if (index != null) header(ACCOUNT_INDEX_HEADER, index.toString())
        }.assertStatus(HttpStatusCode.OK)
            .body()

    private suspend fun HttpClient.deleteUser(id: UInt) {
        delete("/api/v1/users/delete/$id") {
            header(ACCOUNT_INDEX_HEADER, "0")
        }.assertStatus(HttpStatusCode.NoContent)
    }

    private fun sessionCookie(value: String): String = "user_session=${URLEncoder.encode(value, Charsets.UTF_8)}"

    private fun cookieValue(response: HttpResponse): String {
        val header =
            response.headers
                .getAll(HttpHeaders.SetCookie)
                .orEmpty()
                .single { it.startsWith("user_session=") }
        return URLDecoder.decode(header.substringAfter("user_session=").substringBefore(";"), Charsets.UTF_8)
    }
}
