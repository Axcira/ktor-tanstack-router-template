package net.axcira.features.auth

import de.mkammerer.argon2.Argon2Factory
import kotlinx.coroutines.*
import net.axcira.db.Role
import net.axcira.db.SessionsTable
import net.axcira.db.Users
import net.axcira.features.users.UserDTO
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.slf4j.LoggerFactory
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.measureTime

sealed interface ChangePasswordResult {
    data object Success : ChangePasswordResult

    data object WrongPassword : ChangePasswordResult

    data class Invalid(
        val reasons: List<String>,
    ) : ChangePasswordResult
}

suspend fun <T> minWait(
    duration: Duration,
    block: suspend () -> T,
): T {
    val result: Result<T>
    val elapsedTime =
        measureTime {
            result =
                runCatching {
                    block()
                }
        }
    if (elapsedTime < duration) {
        delay(duration - elapsedTime)
    }
    return result.getOrThrow()
}

class AuthService(
    private val database: Database,
) {
    private val log = LoggerFactory.getLogger(AuthService::class.java)

    companion object {
        /** Set `SKIP_LOGIN_MIN_WAIT=true` in tests to avoid timing-mitigation delays on every login. */
        private val loginMinWait: Duration =
            if (System.getenv("SKIP_LOGIN_MIN_WAIT") == "true") {
                Duration.ZERO
            } else {
                1.seconds
            }
    }

    private data class AuthUserCredential(
        val id: UInt,
        val email: String,
        val roleId: UInt,
        val passwordHash: String,
    )

    suspend fun login(
        email: String,
        password: String,
    ): UserSession? =
        minWait(loginMinWait) {
            val credential =
                database.dbQuery {
                    val row =
                        (Users innerJoin Role)
                            .selectAll()
                            .where { Users.email eq email }
                            .singleOrNull()
                            ?: return@dbQuery null

                    AuthUserCredential(
                        id = row[Users.id].value,
                        email = row[Users.email],
                        roleId = row[Role.id].value,
                        passwordHash = row[Users.passwordHash],
                    ) to row[Role.permissions]
                } ?: return@minWait null

            val isValid = PasswordHasher.verifyPassword(password, credential.first.passwordHash)
            if (isValid) {
                log.info("User logged in: ${credential.first.email}")
                return@minWait UserSession(
                    credential.first.let {
                        UserDTO(it.id, it.email, it.roleId)
                    },
                    credential.second,
                )
            } else {
                log.warn("Failed login attempt for email: ${credential.first.email}")
                return@minWait null
            }
        }

    /**
     * Replaces the signed-in user's password after the current one verifies.
     * [keepSessionId] stays valid. Other sessions for the same user are removed only when requested.
     */
    suspend fun changePassword(
        userId: UInt,
        currentPassword: String,
        newPassword: String,
        logoutOtherSessions: Boolean,
        keepSessionId: String?,
    ): ChangePasswordResult {
        val currentHash =
            database.dbQuery {
                Users
                    .selectAll()
                    .where { Users.id eq userId }
                    .singleOrNull()
                    ?.get(Users.passwordHash)
            } ?: return ChangePasswordResult.WrongPassword
        if (!PasswordHasher.verifyPassword(currentPassword, currentHash)) {
            log.warn("Rejected password change for user id=$userId")
            return ChangePasswordResult.WrongPassword
        }
        if (currentPassword == newPassword) {
            return ChangePasswordResult.Invalid(listOf("newPassword must differ from currentPassword"))
        }
        val nextHash = PasswordHasher.hashPassword(newPassword)
        database.dbQuery {
            Users.update({ Users.id eq userId }) {
                it[passwordHash] = nextHash
            }
            if (logoutOtherSessions) {
                invalidateSessions(userId, keepSessionId)
            }
        }
        log.info("Password changed for user id=$userId, logoutOtherSessions=$logoutOtherSessions")
        return ChangePasswordResult.Success
    }

    /**
     * Replaces [userId]'s password without the current one.
     * When [logoutSessions] is true, every session for that user is removed.
     * Returns false when the user does not exist.
     */
    suspend fun forceChangePassword(
        userId: UInt,
        newPassword: String,
        logoutSessions: Boolean,
    ): Boolean {
        val nextHash = PasswordHasher.hashPassword(newPassword)
        val changed =
            database.dbQuery {
                val updated =
                    Users.update({ Users.id eq userId }) {
                        it[passwordHash] = nextHash
                    }
                if (updated == 0) return@dbQuery false
                if (logoutSessions) {
                    invalidateSessions(userId, keepSessionId = null)
                }
                true
            }
        if (changed) {
            log.info("Password force-changed for user id=$userId, logoutSessions=$logoutSessions")
        }
        return changed
    }

    private fun invalidateSessions(
        userId: UInt,
        keepSessionId: String?,
    ) {
        SessionsTable.deleteWhere {
            val owned = SessionsTable.userId eq userId
            if (keepSessionId == null) {
                owned
            } else {
                owned and (SessionsTable.sessionId neq keepSessionId)
            }
        }
    }
}

object PasswordHasher {
    private val log = LoggerFactory.getLogger(PasswordHasher::class.java)
    private val argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id)
    private val pepper = System.getenv("SECRET") ?: "secret"

    // Defaults are production-grade Argon2id. Override via env for tests/local DX.
    // argon2-jvm signature: hash(iterations, memoryKiB, parallelism, password)
    private val iterations = envInt("ARGON2_ITERATIONS", 16)
    private val memoryKiB = envInt("ARGON2_MEMORY_KIB", 65_536)
    private val parallelism = envInt("ARGON2_PARALLELISM", 1)

    init {
        if (iterations < 16 || memoryKiB < 65_536) {
            log.warn(
                "Using reduced Argon2 parameters: iterations={}, memoryKiB={}, parallelism={}",
                iterations,
                memoryKiB,
                parallelism,
            )
        }
    }

    suspend fun hashPassword(password: CharSequence): String =
        withContext(Dispatchers.Default) {
            val passwordWithPepper = "$password$pepper".toCharArray()
            try {
                return@withContext argon2.hash(iterations, memoryKiB, parallelism, passwordWithPepper)
            } finally {
                argon2.wipeArray(passwordWithPepper)
            }
        }

    suspend fun verifyPassword(
        password: CharSequence,
        hash: String,
    ): Boolean =
        withContext(Dispatchers.Default) {
            val passwordWithPepper = "$password$pepper".toCharArray()
            try {
                // Params are embedded in the encoded hash; verify does not use the configured costs.
                return@withContext argon2.verify(hash, passwordWithPepper)
            } finally {
                argon2.wipeArray(passwordWithPepper)
            }
        }

    private fun envInt(
        name: String,
        default: Int,
    ): Int = System.getenv(name)?.toIntOrNull()?.takeIf { it > 0 } ?: default
}
