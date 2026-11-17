package net.axcira.features.auth

import de.mkammerer.argon2.Argon2Factory
import io.ktor.util.generateNonceSuspend
import kotlinx.coroutines.*
import net.axcira.db.AccountSessions
import net.axcira.db.Roles
import net.axcira.db.Sessions
import net.axcira.db.Users
import net.axcira.features.users.UserDTO
import net.axcira.isDevelopment
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.select
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

sealed interface AccountPlan {
    data class Ready(
        val accounts: List<StoredAccount>,
        val accountIndex: Int,
        val sessionId: String,
    ) : AccountPlan

    data object LimitReached : AccountPlan

    /** The presented device session was already consumed by another login. */
    data object SessionConflict : AccountPlan
}

sealed interface AccountResolution {
    data class Ready(
        val session: UserSession,
    ) : AccountResolution

    data object Missing : AccountResolution

    data object InvalidIndex : AccountResolution

    /** The slot is still on this device, but the account has to sign in again. */
    data object ReauthRequired : AccountResolution
}

sealed interface LogoutAccountResult {
    data object Success : LogoutAccountResult

    data object Unauthenticated : LogoutAccountResult

    data object NotFound : LogoutAccountResult
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
        /**
         * Test pauses. Each value is an array of two [java.util.concurrent.CountDownLatch]es:
         * the first is counted down when the code reaches the pause, and the second is awaited.
         * Latches live on the bootstrap classpath, so they are visible from the Ktor test classloader.
         */
        internal const val PAUSE_AFTER_SNAPSHOT = "axcira.test.afterAccountSnapshot"
        internal const val PAUSE_BEFORE_REVOKE = "axcira.test.beforeRevokeLocks"

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
                        (Users innerJoin Roles)
                            .selectAll()
                            .where { Users.email eq email }
                            .singleOrNull()
                            ?: return@dbQuery null

                    AuthUserCredential(
                        id = row[Users.id].value,
                        email = row[Users.email],
                        roleId = row[Roles.id].value,
                        passwordHash = row[Users.passwordHash],
                    ) to row[Roles.permissions]
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
                revokeAccountSessions(userId, keepSessionId)
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
                    revokeAccountSessions(userId, keepDeviceSessionId = null)
                }
                true
            }
        if (changed) {
            log.info("Password force-changed for user id=$userId, logoutSessions=$logoutSessions")
        }
        return changed
    }

    /**
     * Plans a login and consumes the previous device session in one transaction.
     *
     * The previous session row is locked, so a second login cannot allocate the same free index
     * or copy accounts that a revocation committed before this transaction. Account rows for the
     * new id are inserted here. The later session write finds them and does not insert them again.
     *
     * [addAccount] false replaces the device session with only [userId] at index 0.
     * [addAccount] true keeps the other live accounts, reuses [userId]'s index when that user is
     * already signed in, and otherwise takes the lowest free index. A missing previous row while
     * adding an account is [AccountPlan.SessionConflict] instead of a second device session.
     * A missing row on a replace login starts a fresh session, which is how an expired cookie signs in.
     */
    suspend fun rotateLogin(
        deviceSessionId: String?,
        userId: UInt,
        addAccount: Boolean,
        nowMillis: Long = System.currentTimeMillis(),
    ): AccountPlan {
        val newSessionId = generateNonceSuspend()
        val expiresAt = nowMillis + SESSION_MAX_AGE_SECONDS * 1000
        return database.dbQuery {
            val existing =
                if (deviceSessionId == null) {
                    emptyList()
                } else {
                    val locked =
                        Sessions
                            .selectAll()
                            .where { Sessions.sessionId eq deviceSessionId }
                            .forUpdate()
                            .singleOrNull()
                    if (locked == null) {
                        if (addAccount) return@dbQuery AccountPlan.SessionConflict
                        emptyList()
                    } else {
                        val sessionExpiresAt = locked[Sessions.expiresAt]
                        val live = sessionExpiresAt != null && sessionExpiresAt > nowMillis / 1000
                        val accounts =
                            if (addAccount && live) {
                                activeAccounts(deviceSessionId, nowMillis)
                            } else {
                                emptyList()
                            }
                        awaitTestPause(PAUSE_AFTER_SNAPSHOT)
                        accounts
                    }
                }
            val already = existing.find { it.userId == userId }
            val accounts: List<StoredAccount>
            val index: Int
            if (already != null) {
                accounts =
                    existing.map { account ->
                        if (account.userId == userId) {
                            account.copy(expiresAt = expiresAt, activatedAt = nowMillis, requiresReauth = false)
                        } else {
                            account
                        }
                    }
                index = already.index
            } else if (existing.size >= MAX_ACCOUNTS_PER_DEVICE) {
                log.warn("Rejected adding account for user id=$userId; device session already has $MAX_ACCOUNTS_PER_DEVICE accounts")
                return@dbQuery AccountPlan.LimitReached
            } else {
                val used = existing.map { it.index }.toSet()
                index = (0 until MAX_ACCOUNTS_PER_DEVICE).first { it !in used }
                accounts =
                    existing +
                    StoredAccount(
                        index = index,
                        userId = userId,
                        createdAt = nowMillis,
                        expiresAt = expiresAt,
                        activatedAt = nowMillis,
                        requiresReauth = false,
                    )
            }
            if (deviceSessionId != null &&
                Sessions.selectAll().where { Sessions.sessionId eq deviceSessionId }.count() > 0L
            ) {
                AccountSessions.deleteWhere { AccountSessions.deviceSessionId eq deviceSessionId }
                Sessions.deleteWhere { Sessions.sessionId eq deviceSessionId }
            }
            Sessions.insert {
                it[sessionId] = newSessionId
                it[session] = "{}"
                it[Sessions.userId] = userId
                it[Sessions.expiresAt] = nowMillis / 1000 + SESSION_MAX_AGE_SECONDS
            }
            accounts.forEach { account ->
                AccountSessions.insert {
                    it[AccountSessions.deviceSessionId] = newSessionId
                    it[accountIndex] = account.index
                    it[AccountSessions.userId] = account.userId
                    it[createdAt] = account.createdAt
                    it[AccountSessions.expiresAt] = account.expiresAt
                    it[activatedAt] = account.activatedAt
                    it[requiresReauth] = account.requiresReauth
                }
            }
            AccountPlan.Ready(accounts, index, newSessionId)
        }
    }

    /**
     * Resolves the principal for [deviceSessionId].
     * A blank [accountIndexHeader] uses the default usable account. An explicit index that is missing
     * or revoked is [AccountResolution.InvalidIndex]. A slot that is still listed but must sign in
     * again is [AccountResolution.ReauthRequired].
     * A successful explicit index that is not already the default becomes the default.
     */
    suspend fun resolveAccount(
        deviceSessionId: String,
        accountIndexHeader: String?,
    ): AccountResolution {
        val nowMillis = System.currentTimeMillis()
        val accounts =
            database.dbQuery {
                if (!deviceSessionLive(deviceSessionId, nowMillis / 1000)) return@dbQuery null
                activeAccounts(deviceSessionId, nowMillis)
            } ?: return AccountResolution.Missing
        val usable = accounts.filter { !it.requiresReauth }
        if (accounts.isEmpty()) return AccountResolution.Missing
        val header = accountIndexHeader?.takeIf { it.isNotBlank() }
        val selected =
            if (header == null) {
                usable.defaultAccount()
            } else {
                val index = header.toIntOrNull()
                if (index == null || index !in 0 until MAX_ACCOUNTS_PER_DEVICE) {
                    return AccountResolution.InvalidIndex
                }
                val slot = accounts.find { it.index == index } ?: return AccountResolution.InvalidIndex
                if (slot.requiresReauth) return AccountResolution.ReauthRequired
                slot
            } ?: return AccountResolution.Missing
        val defaultAccount = usable.defaultAccount()
        if (header != null && defaultAccount != null && selected.index != defaultAccount.index) {
            database.dbQuery {
                markDefault(deviceSessionId, selected, nowMillis)
            }
        }
        val session = loadUserSession(selected.userId) ?: return AccountResolution.Missing
        return AccountResolution.Ready(session)
    }

    /** Accounts on a live device session. Null when the device session is missing or expired. */
    suspend fun listAccounts(deviceSessionId: String): List<AccountSummary>? {
        val nowMillis = System.currentTimeMillis()
        return database.dbQuery {
            if (!deviceSessionLive(deviceSessionId, nowMillis / 1000)) return@dbQuery null
            val accounts = activeAccounts(deviceSessionId, nowMillis)
            val defaultIndex = accounts.filter { !it.requiresReauth }.defaultAccount()?.index
            accounts
                .sortedBy { it.index }
                .mapNotNull { account ->
                    val email =
                        Users
                            .selectAll()
                            .where { Users.id eq account.userId }
                            .singleOrNull()
                            ?.get(Users.email)
                            ?: return@mapNotNull null
                    AccountSummary(
                        index = account.index,
                        displayName = displayNameForEmail(email),
                        email = email,
                        avatarUrl = null,
                        isDefault = account.index == defaultIndex,
                        requiresReauth = account.requiresReauth,
                    )
                }
        }
    }

    suspend fun hasActiveAccounts(deviceSessionId: String): Boolean {
        val nowMillis = System.currentTimeMillis()
        return database.dbQuery {
            if (!deviceSessionLive(deviceSessionId, nowMillis / 1000)) return@dbQuery false
            activeAccounts(deviceSessionId, nowMillis).isNotEmpty()
        }
    }

    /** Revokes one account slot. Other accounts on the device stay signed in. */
    suspend fun logoutAccount(
        deviceSessionId: String,
        index: Int,
    ): LogoutAccountResult {
        val nowMillis = System.currentTimeMillis()
        return database.dbQuery {
            // Same order as login and revocation: the device session, then its account rows.
            Sessions
                .selectAll()
                .where { Sessions.sessionId eq deviceSessionId }
                .forUpdate()
                .singleOrNull()
            if (!deviceSessionLive(deviceSessionId, nowMillis / 1000)) {
                return@dbQuery LogoutAccountResult.Unauthenticated
            }
            val updated =
                AccountSessions.update({
                    (AccountSessions.deviceSessionId eq deviceSessionId) and
                        (AccountSessions.accountIndex eq index) and
                        AccountSessions.revokedAt.isNull()
                }) {
                    it[revokedAt] = nowMillis
                }
            if (updated == 0) return@dbQuery LogoutAccountResult.NotFound
            val remaining = activeAccounts(deviceSessionId, nowMillis)
            val next = remaining.filter { !it.requiresReauth }.defaultAccount()
            if (next == null) {
                Sessions.update({ Sessions.sessionId eq deviceSessionId }) {
                    it[userId] = null
                }
            } else {
                markDefault(deviceSessionId, next, next.activatedAt)
            }
            LogoutAccountResult.Success
        }
    }

    private suspend fun revokeAccountSessions(
        userId: UInt,
        keepDeviceSessionId: String?,
    ) {
        val now = System.currentTimeMillis()
        val ownedAndActive = {
            val owned = AccountSessions.userId eq userId
            val active = AccountSessions.revokedAt.isNull()
            if (keepDeviceSessionId == null) {
                owned and active
            } else {
                owned and active and (AccountSessions.deviceSessionId neq keepDeviceSessionId)
            }
        }
        val deviceIds =
            AccountSessions
                .select(AccountSessions.deviceSessionId)
                .where { ownedAndActive() }
                .map { it[AccountSessions.deviceSessionId] }
                .distinct()
        awaitTestPause(PAUSE_BEFORE_REVOKE)
        if (deviceIds.isNotEmpty()) {
            // Lock the device rows before revoking so a login cannot copy these accounts afterward.
            Sessions
                .select(Sessions.sessionId)
                .where { Sessions.sessionId inList deviceIds }
                .forUpdate()
                .toList()
        }
        // Wait for a login that already snapshotted these rows. The update is a later statement,
        // so it also flags the device session that login inserts before this one resumes.
        AccountSessions
            .select(AccountSessions.id)
            .where { ownedAndActive() }
            .forUpdate()
            .toList()
        AccountSessions.update({ ownedAndActive() }) {
            it[requiresReauth] = true
        }
    }

    /**
     * Blocks only when a test installed a latch pair under [key]. Production never sets it.
     * Waiting here keeps the surrounding transaction and its row locks open.
     */
    private fun awaitTestPause(key: String) {
        val pair = System.getProperties()[key] as? Array<*> ?: return
        val entered = pair[0] as java.util.concurrent.CountDownLatch
        val resume = pair[1] as java.util.concurrent.CountDownLatch
        entered.countDown()
        resume.await()
    }

    private fun deviceSessionLive(
        deviceSessionId: String,
        nowSeconds: Long,
    ): Boolean {
        val row =
            Sessions
                .select(Sessions.expiresAt)
                .where { Sessions.sessionId eq deviceSessionId }
                .singleOrNull()
                ?: return false
        val expiresAt = row[Sessions.expiresAt] ?: return false
        return expiresAt > nowSeconds
    }

    /**
     * Marks expired slots as needing another sign-in, then returns every slot that is still listed.
     * Must run inside a transaction. Rows with [StoredAccount.requiresReauth] keep their index.
     */
    private fun activeAccounts(
        deviceSessionId: String,
        nowMillis: Long,
    ): List<StoredAccount> {
        AccountSessions.update({
            (AccountSessions.deviceSessionId eq deviceSessionId) and
                AccountSessions.revokedAt.isNull() and
                (AccountSessions.requiresReauth eq false) and
                (AccountSessions.expiresAt lessEq nowMillis)
        }) {
            it[requiresReauth] = true
        }
        return AccountSessions
            .selectAll()
            .where {
                (AccountSessions.deviceSessionId eq deviceSessionId) and
                    AccountSessions.revokedAt.isNull()
            }.forUpdate()
            .map { row ->
                StoredAccount(
                    index = row[AccountSessions.accountIndex],
                    userId = row[AccountSessions.userId],
                    createdAt = row[AccountSessions.createdAt],
                    expiresAt = row[AccountSessions.expiresAt],
                    activatedAt = row[AccountSessions.activatedAt],
                    requiresReauth = row[AccountSessions.requiresReauth],
                )
            }
    }

    private fun markDefault(
        deviceSessionId: String,
        account: StoredAccount,
        activatedAt: Long,
    ) {
        AccountSessions.update({
            (AccountSessions.deviceSessionId eq deviceSessionId) and
                (AccountSessions.accountIndex eq account.index) and
                AccountSessions.revokedAt.isNull()
        }) {
            it[AccountSessions.activatedAt] = activatedAt
        }
        val payload =
            Sessions
                .select(Sessions.session)
                .where { Sessions.sessionId eq deviceSessionId }
                .singleOrNull()
                ?.get(Sessions.session)
        val updatedPayload =
            payload?.let { raw ->
                runCatching {
                    val device = sessionJson.decodeFromString(DeviceSession.serializer(), raw)
                    sessionJson.encodeToString(DeviceSession.serializer(), device.copy(defaultUserId = account.userId))
                }.getOrDefault(raw)
            }
        Sessions.update({ Sessions.sessionId eq deviceSessionId }) {
            it[userId] = account.userId
            if (updatedPayload != null) it[session] = updatedPayload
        }
    }

    private suspend fun loadUserSession(userId: UInt): UserSession? =
        database.dbQuery {
            (Users innerJoin Roles)
                .selectAll()
                .where { Users.id eq userId }
                .singleOrNull()
                ?.let { row ->
                    UserSession(
                        UserDTO(row[Users.id].value, row[Users.email], row[Users.roleId].value),
                        row[Roles.permissions],
                    )
                }
        }
}

object PasswordHasher {
    private val log = LoggerFactory.getLogger(PasswordHasher::class.java)
    private val argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id)
    private val pepper: String by lazy { resolvePepper() }

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

    /**
     * Resolves the Argon2 pepper from [secretEnv].
     * Outside development mode, a missing or blank `SECRET` fails fast with [IllegalStateException].
     */
    internal fun resolvePepper(
        secretEnv: String? = System.getenv("SECRET"),
        development: Boolean = isDevelopment,
    ): String =
        if (!secretEnv.isNullOrBlank()) {
            secretEnv
        } else if (development) {
            log.warn("No SECRET environment variable set. Using 'secret' as default in development mode.")
            "secret"
        } else {
            throw IllegalStateException("No SECRET environment variable set.")
        }

    /**
     * Eagerly validates that the Argon2 pepper is configured.
     */
    fun ensureConfigured() {
        pepper
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
