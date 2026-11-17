package net.axcira.features.auth

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.response.*
import io.ktor.server.sessions.SessionStorage
import io.ktor.server.sessions.cookie
import io.ktor.server.sessions.serialization.KotlinxSessionSerializer
import io.ktor.util.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import net.axcira.db.*
import net.axcira.db.Sessions.sessionId
import net.axcira.features.permissions.Permission
import net.axcira.features.users.UserDTO
import net.axcira.isDevelopment
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.jdbc.*
import kotlin.time.Duration.Companion.days
import io.ktor.server.sessions.Sessions as KtorSessions

/** Cookie that holds only the device session id. */
const val SESSION_COOKIE_NAME = "user_session"

/** Selects which account on the device session handles the request. Absent means the default account. */
const val ACCOUNT_INDEX_HEADER = "X-Account-Index"

const val ACCOUNT_INDEX_INVALID = "ACCOUNT_INDEX_INVALID"
const val ACCOUNT_REAUTH_REQUIRED = "ACCOUNT_REAUTH_REQUIRED"
const val ACCOUNT_LIMIT_REACHED = "ACCOUNT_LIMIT_REACHED"

/** Another login already consumed this device session. The client should reload and use the winning cookie. */
const val SESSION_SUPERSEDED = "SESSION_SUPERSEDED"
const val MAX_ACCOUNTS_PER_DEVICE = 10

/**
 * Default session lifetime applied to the session cookie and the device session row.
 * Account sessions store the same lifetime in milliseconds.
 */
val SESSION_MAX_AGE_SECONDS: Long = 7.days.inWholeSeconds

val AccountIndexInvalidKey = AttributeKey<Boolean>("AccountIndexInvalid")
val AccountReauthRequiredKey = AttributeKey<Boolean>("AccountReauthRequired")

/** Same Json instance Ktor uses for the device-session document. */
internal val sessionJson = Json

@Serializable
data class UserSession(
    val user: UserDTO,
    val permissions: List<Permission>,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    /** When true, add the user to the current device session instead of replacing it. */
    val addAccount: Boolean = false,
)

@Serializable
data class LoginResponse(
    val user: UserDTO,
    val permissions: List<Permission>,
    val accountIndex: Int,
)

@Serializable
data class ErrorResponse(
    val code: String,
    val message: String,
)

@Serializable
data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String,
    val logoutOtherSessions: Boolean = false,
)

@Serializable
data class ForceChangePasswordRequest(
    val newPassword: String,
    val logoutSessions: Boolean = false,
)

/**
 * Account slot carried in the device-session document so a rotated session id can be persisted
 * with its accounts in one storage write. The account_sessions table is the source of truth after that.
 */
@Serializable
data class StoredAccount(
    val index: Int,
    val userId: UInt,
    val createdAt: Long,
    val expiresAt: Long,
    val activatedAt: Long,
    val requiresReauth: Boolean = false,
)

/**
 * Server-side session document. The cookie value is only the device session id.
 *
 * [defaultUserId] mirrors the most recently signed-in or switched-to account so the sessions.user_id
 * column stays populated for operational queries. Account selection uses account_sessions.
 */
@Serializable
data class DeviceSession(
    val defaultUserId: UInt? = null,
    val accounts: List<StoredAccount> = emptyList(),
)

@Serializable
data class AccountSummary(
    val index: Int,
    val displayName: String,
    val email: String,
    val avatarUrl: String? = null,
    val isDefault: Boolean,
    val requiresReauth: Boolean,
)

class DatabaseSessionStorage(
    private val database: Database,
    private val maxAgeSeconds: Long = SESSION_MAX_AGE_SECONDS,
    private val clockEpochSeconds: () -> Long = { System.currentTimeMillis() / 1000 },
) : SessionStorage {
    override suspend fun invalidate(id: String) {
        database.dbQuery {
            AccountSessions.deleteWhere { AccountSessions.deviceSessionId eq id }
            Sessions.deleteWhere { sessionId eq id }
        }
    }

    override suspend fun read(id: String): String {
        val payload =
            database.dbQuery {
                val row =
                    Sessions
                        .select(Sessions.session, Sessions.expiresAt)
                        .where { sessionId eq id }
                        .singleOrNull()
                        ?: return@dbQuery null
                val expiresAt = row[Sessions.expiresAt]
                if (expiresAt == null || expiresAt <= clockEpochSeconds()) {
                    AccountSessions.deleteWhere { AccountSessions.deviceSessionId eq id }
                    Sessions.deleteWhere { sessionId eq id }
                    return@dbQuery null
                }
                row[Sessions.session]
            }
        return payload ?: throw NoSuchElementException("Session $id not found")
    }

    override suspend fun write(
        id: String,
        value: String,
    ) {
        val now = clockEpochSeconds()
        val expiresAtEpochSeconds = now + maxAgeSeconds
        val device = runCatching { sessionJson.decodeFromString(DeviceSession.serializer(), value) }.getOrNull()
        database.dbQuery {
            val expiredIds =
                Sessions
                    .select(sessionId)
                    .where { Sessions.expiresAt.isNull() or (Sessions.expiresAt lessEq now) }
                    .map { it[sessionId] }
            // One statement cannot bind more than 65,535 JDBC parameters. An empty list deletes nothing.
            expiredIds.chunked(10_000).forEach { batch ->
                AccountSessions.deleteWhere { AccountSessions.deviceSessionId inList batch }
                Sessions.deleteWhere { sessionId inList batch }
            }
            Sessions.upsert {
                it[sessionId] = id
                it[session] = value
                it[Sessions.userId] = device?.defaultUserId ?: sessionUserId(value)
                it[Sessions.expiresAt] = expiresAtEpochSeconds
            }
            if (device != null && device.accounts.isNotEmpty()) {
                val existing =
                    AccountSessions
                        .selectAll()
                        .where { AccountSessions.deviceSessionId eq id }
                        .count()
                if (existing == 0L) {
                    device.accounts.forEach { account ->
                        AccountSessions.insert {
                            it[deviceSessionId] = id
                            it[accountIndex] = account.index
                            it[userId] = account.userId
                            it[createdAt] = account.createdAt
                            it[expiresAt] = account.expiresAt
                            it[activatedAt] = account.activatedAt
                            it[requiresReauth] = account.requiresReauth
                        }
                    }
                }
            }
        }
    }
}

/**
 * Configures cookie-based device sessions and resolves the account principal for each request.
 *
 * The cookie stays HttpOnly, Secure outside development, and SameSite=Lax. Its value is the device
 * session id. [ACCOUNT_INDEX_HEADER] chooses the account; a missing header uses the most recently
 * signed-in or switched-to valid account.
 */
fun Application.configureAuthentication() {
    val database: Database by dependencies
    val authService: AuthService by dependencies
    install(KtorSessions) {
        cookie<DeviceSession>(SESSION_COOKIE_NAME, DatabaseSessionStorage(database)) {
            serializer = KotlinxSessionSerializer(Json)
            cookie.path = "/"
            cookie.httpOnly = true
            cookie.secure = !isDevelopment
            cookie.maxAgeInSeconds = SESSION_MAX_AGE_SECONDS
            cookie.extensions["SameSite"] = "Lax"
        }
    }
    install(Authentication) {
        session<DeviceSession> {
            validate { _ ->
                val deviceSessionId = request.cookies[SESSION_COOKIE_NAME] ?: return@validate null
                when (val resolved = authService.resolveAccount(deviceSessionId, request.headers[ACCOUNT_INDEX_HEADER])) {
                    is AccountResolution.Ready -> {
                        resolved.session
                    }

                    AccountResolution.InvalidIndex -> {
                        attributes.put(AccountIndexInvalidKey, true)
                        null
                    }

                    AccountResolution.ReauthRequired -> {
                        attributes.put(AccountReauthRequiredKey, true)
                        null
                    }

                    AccountResolution.Missing -> {
                        null
                    }
                }
            }
            challenge {
                if (call.attributes.getOrNull(AccountReauthRequiredKey) == true) {
                    call.respond(
                        HttpStatusCode.Unauthorized,
                        ErrorResponse(
                            code = ACCOUNT_REAUTH_REQUIRED,
                            message = "This account needs to sign in again.",
                        ),
                    )
                } else if (call.attributes.getOrNull(AccountIndexInvalidKey) == true) {
                    call.respond(
                        HttpStatusCode.Unauthorized,
                        ErrorResponse(
                            code = ACCOUNT_INDEX_INVALID,
                            message = "The selected account is not signed in on this browser.",
                        ),
                    )
                } else {
                    call.respond(UnauthorizedResponse())
                }
            }
        }
    }
}

internal fun sessionUserId(payload: String): UInt? {
    runCatching { sessionJson.decodeFromString(UserSession.serializer(), payload).user.id }
        .getOrNull()
        ?.let { return it }
    runCatching { sessionJson.decodeFromString(DeviceSession.serializer(), payload).defaultUserId }
        .getOrNull()
        ?.let { return it }
    return sessionUserIdPattern
        .find(payload)
        ?.groupValues
        ?.get(1)
        ?.toUIntOrNull()
}

private val sessionUserIdPattern = Regex(""""id"\s*:\s*(\d+)""")

/** Most recently activated account. Equal timestamps break toward the higher index. */
internal fun List<StoredAccount>.defaultAccount(): StoredAccount? = maxWithOrNull(compareBy({ it.activatedAt }, { it.index }))

internal fun displayNameForEmail(email: String): String = email.substringBefore('@').ifBlank { email }
