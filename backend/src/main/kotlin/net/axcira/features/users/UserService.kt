package net.axcira.features.users

import kotlinx.serialization.Serializable
import net.axcira.db.Users
import net.axcira.features.auth.PasswordHasher
import net.axcira.plugins.Optional
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*

@Serializable
data class CreateUserInput(val email: String, val password: String, val roleId: UInt)

@Serializable
data class UpdateUserInput(val email: Optional<String>, val password: Optional<String>, val roleId: Optional<UInt>)

@Serializable
data class UserDTO(val id: UInt, val email: String, val roleId: UInt? = null)

class UserService(val database: Database) {
    suspend fun createUser(user: CreateUserInput): UserDTO {
        val hash = PasswordHasher.hashPassword(user.password)
        return database.dbQuery {
            val createdUser = Users.insertReturning {
                it[email] = user.email
                it[passwordHash] = hash
                it[roleId] = user.roleId
            }.single()
            UserDTO(createdUser[Users.id].value, createdUser[Users.email], createdUser[Users.roleId].value)
        }
    }

    suspend fun update(id: UInt, user: UpdateUserInput) {
        val (email, password, roleId) = user
        if (arrayOf(email, password, roleId).all { it == Optional.None }) return
        val hash = if (password is Optional.Present) PasswordHasher.hashPassword(password.value) else null
        database.dbQuery {
            Users.update({ Users.id eq id }) {
                if (email is Optional.Present) it[Users.email] = email.value
                if (hash != null) it[passwordHash] = hash
                if (roleId is Optional.Present) it[Users.roleId] = roleId.value
            }
        }
    }

    suspend fun delete(id: UInt) {
        database.dbQuery { Users.deleteWhere { Users.id eq id } }
    }

    suspend fun findById(id: UInt): UserDTO? {
        return database.dbQuery {
            Users.selectAll().where { Users.id eq id }.map { UserDTO(it[Users.id].value, it[Users.email], it[Users.roleId].value) }
                .singleOrNull()
        }
    }
}
