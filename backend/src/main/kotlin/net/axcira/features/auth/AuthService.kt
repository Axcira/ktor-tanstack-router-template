package net.axcira.features.auth

import de.mkammerer.argon2.Argon2Factory
import net.axcira.features.users.Users
import net.axcira.plugins.UserSession
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

class AuthService(private val database: Database) {
    private data class AuthUserCredential(
        val id: UInt, val email: String, val passwordHash: String
    )

    fun login(email: String, password: String): UserSession? = transaction(database) {
        val credential = Users.selectAll().where { Users.email eq email }.map {
            AuthUserCredential(it[Users.id].value, it[Users.email], it[Users.passwordHash])
        }.singleOrNull() ?: return@transaction null
        if (!PasswordHasher.verifyPassword(password, credential.passwordHash)) return@transaction null

        return@transaction UserSession(credential.id)
    }
}

object PasswordHasher {
    private val argon2 = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id)
    private val pepper = System.getenv("SECRET") ?: "secret"

    fun hashPassword(password: CharSequence): String {
        val passwordWithPepper = "$password$pepper".toCharArray()
        try {
            return argon2.hash(16, 65536, 1, passwordWithPepper)
        } finally {
            argon2.wipeArray(passwordWithPepper)
        }
    }

    fun verifyPassword(password: CharSequence, hash: String): Boolean {
        val passwordWithPepper = "$password$pepper".toCharArray()
        try {
            return argon2.verify(hash, passwordWithPepper)
        } finally {
            argon2.wipeArray(passwordWithPepper)
        }
    }
}
