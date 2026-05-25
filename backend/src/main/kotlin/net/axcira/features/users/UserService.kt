package net.axcira.features.users

import kotlinx.serialization.Serializable
import net.axcira.features.auth.PasswordHasher
import org.jetbrains.exposed.v1.core.dao.id.UIntIdTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.suspendTransaction

@Serializable
data class CreateUserInput(val email: String, val password: String)

@Serializable
data class UpdateUserInput(val email: String?, val password: String?)

@Serializable
data class UserDTO(val id: UInt, val email: String)

object Users : UIntIdTable() {
    val email = varchar("email", length = 50).uniqueIndex()
    val passwordHash = varchar("password_hash", length = 128)
}

class UserService(val database: Database) {
    suspend fun createUser(user: CreateUserInput): UserDTO {
        return suspendTransaction(database) {
            val id = Users.insert {
                it[email] = user.email
                it[passwordHash] = PasswordHasher.hashPassword(user.password)
            } get Users.id
            UserDTO(id.value, user.email)
        }
    }

    suspend fun update(id: UInt, user: UpdateUserInput) {
        suspendTransaction(database) {
            Users.update({ Users.id eq id }) {
                if (user.email != null) it[email] = user.email
                if (user.password != null) it[passwordHash] = PasswordHasher.hashPassword(user.password)
            }
        }
    }

    suspend fun delete(id: UInt) {
        suspendTransaction(database) { Users.deleteWhere { Users.id eq id } }
    }

    suspend fun findById(id: UInt): UserDTO? {
        return suspendTransaction(database) {
            Users.selectAll().where { Users.id eq id }.map { UserDTO(it[Users.id].value, it[Users.email]) }.singleOrNull()
        }
    }
}
