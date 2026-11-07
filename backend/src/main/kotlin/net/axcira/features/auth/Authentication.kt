package net.axcira.features.auth

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.sessions.SessionStorage
import io.ktor.server.sessions.cookie
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import net.axcira.db.*
import net.axcira.db.Sessions.sessionId
import net.axcira.features.permissions.Permission
import net.axcira.features.users.UserDTO
import net.axcira.isDevelopment
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.jdbc.*
import io.ktor.server.sessions.Sessions as KtorSessions

@Serializable
data class UserSession(
    val user: UserDTO,
    val permissions: List<Permission>,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
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
 * Default session lifetime (7 days in seconds) applied to both the session cookie and database storage.
 */
const val SESSION_MAX_AGE_SECONDS: Long = 7L * 24 * 60 * 60

class DatabaseSessionStorage(
    private val database: Database,
    private val maxAgeSeconds: Long = SESSION_MAX_AGE_SECONDS,
    private val clockEpochSeconds: () -> Long = { System.currentTimeMillis() / 1000 },
) : SessionStorage {
    override suspend fun invalidate(id: String) {
        database.dbQuery {
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
        database.dbQuery {
            Sessions.deleteWhere {
                Sessions.expiresAt.isNull() or (Sessions.expiresAt lessEq now)
            }
            Sessions.upsert {
                it[sessionId] = id
                it[session] = value
                it[Sessions.userId] = sessionUserId(value)
                it[Sessions.expiresAt] = expiresAtEpochSeconds
            }
        }
    }
}

/**
 * Configures cookie-based session storage and session authentication.
 */
fun Application.configureAuthentication() {
    val database: Database by dependencies
    install(KtorSessions) {
        cookie<UserSession>("user_session", DatabaseSessionStorage(database)) {
            cookie.path = "/"
            cookie.httpOnly = true
            cookie.secure = !isDevelopment
            cookie.maxAgeInSeconds = SESSION_MAX_AGE_SECONDS
            cookie.extensions["SameSite"] = "Lax"
        }
    }
    install(Authentication) {
        session<UserSession> {
            validate { session ->
                database.dbQuery {
                    (Users innerJoin Roles).selectAll().where { Users.id eq session.user.id }.singleOrNull()?.let {
                        UserSession(
                            UserDTO(
                                it[Users.id].value, it[Users.email], it[Users.roleId].value,
                            ),
                            it[Roles.permissions],
                        )
                    }
                }
            }
        }
    }
}

private val sessionJson = Json { ignoreUnknownKeys = true }

private val sessionUserIdPattern = Regex(""""id"\s*:\s*(\d+)""")

internal fun sessionUserId(payload: String): UInt? {
    val decoded =
        runCatching {
            sessionJson.decodeFromString(UserSession.serializer(), payload).user.id
        }.getOrNull()
    if (decoded != null) return decoded
    return sessionUserIdPattern
        .find(payload)
        ?.groupValues
        ?.get(1)
        ?.toUIntOrNull()
}
