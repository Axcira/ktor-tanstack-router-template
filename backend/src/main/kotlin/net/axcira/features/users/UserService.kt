package net.axcira.features.users

import kotlinx.serialization.Serializable
import net.axcira.db.Users
import net.axcira.features.auth.PasswordHasher
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*

@Serializable
data class CreateUserInput(val email: String, val password: String, val roleId: UInt)

@Serializable
data class UpdateUserInput(val email: String?, val password: String?, val roleId: UInt?)

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
        if (user.email == null && user.password == null && user.roleId == null) return
        val hash = if (user.password != null) PasswordHasher.hashPassword(user.password) else null
        database.dbQuery {
            Users.update({ Users.id eq id }) {
                if (user.email != null) it[email] = user.email
                if (hash != null) it[passwordHash] = hash
                if (user.roleId != null) it[roleId] = user.roleId
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
