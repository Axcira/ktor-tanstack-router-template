package net.axcira.features.auth

import de.mkammerer.argon2.Argon2Factory
import kotlinx.coroutines.*
import net.axcira.features.users.Users
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.selectAll
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.measureTime

suspend fun <T> minWait(duration: Duration, block: suspend () -> T): T {
    val result: Result<T>
    val elapsedTime = measureTime {
        result = runCatching {
            block()
        }
    }
    if (elapsedTime < duration) {
        delay(duration - elapsedTime)
    }
    return result.getOrThrow()
}

class AuthService(private val database: Database) {
    private data class AuthUserCredential(
        val id: UInt, val email: String, val passwordHash: String
    )

    suspend fun login(email: String, password: String): UserSession? = minWait(1.seconds) {
        val credential = database.dbQuery {
            Users.selectAll().where { Users.email eq email }.map {
                AuthUserCredential(it[Users.id].value, it[Users.email], it[Users.passwordHash])
            }.singleOrNull() ?: return@dbQuery null
        } ?: return@minWait null

        val isValid = PasswordHasher.verifyPassword(password, credential.passwordHash)
        return@minWait if (isValid) UserSession(credential.id) else null
    }
}

object PasswordHasher {
    private val argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id)
    private val pepper = System.getenv("SECRET") ?: "secret"

    suspend fun hashPassword(password: CharSequence): String = withContext(Dispatchers.Default) {
        val passwordWithPepper = "$password$pepper".toCharArray()
        try {
            return@withContext argon2.hash(16, 65536, 1, passwordWithPepper)
        } finally {
            argon2.wipeArray(passwordWithPepper)
        }
    }

    suspend fun verifyPassword(password: CharSequence, hash: String): Boolean = withContext(Dispatchers.Default) {
        val passwordWithPepper = "$password$pepper".toCharArray()
        try {
            return@withContext argon2.verify(hash, passwordWithPepper)
        } finally {
            argon2.wipeArray(passwordWithPepper)
        }
    }
}
