package net.axcira.features.users

import kotlinx.serialization.Serializable
import net.axcira.Pagination
import net.axcira.UpdateResult
import net.axcira.db.Users
import net.axcira.features.auth.PasswordHasher
import net.axcira.paginate
import net.axcira.plugins.Optional
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*
import org.slf4j.LoggerFactory

@Serializable
data class CreateUserInput(
    val email: String,
    val password: String,
    val roleId: UInt,
)

@Serializable
data class UpdateUserInput(
    val email: Optional<String> = Optional.None,
    val password: Optional<String> = Optional.None,
    val roleId: Optional<UInt> = Optional.None,
)

@Serializable
data class UserDTO(
    val id: UInt,
    val email: String,
    val roleId: UInt? = null,
)

class UserService(
    val database: Database,
) {
    private val log = LoggerFactory.getLogger(UserService::class.java)

    suspend fun createUser(user: CreateUserInput): UserDTO {
        val hash = PasswordHasher.hashPassword(user.password)
        return database.dbQuery {
            val createdUser =
                Users
                    .insertReturning {
                        it[email] = user.email
                        it[passwordHash] = hash
                        it[roleId] = user.roleId
                    }.single()
            val dto = UserDTO(createdUser[Users.id].value, createdUser[Users.email], createdUser[Users.roleId].value)
            log.info("User created: id=${dto.id}, email=${dto.email}")
            dto
        }
    }

    suspend fun update(
        id: UInt,
        user: UpdateUserInput,
    ): UpdateResult<UserDTO> {
        val (email, password, roleId) = user
        if (arrayOf(email, password, roleId).all { it == Optional.None }) return UpdateResult.NotModified
        val hash =
            when (password) {
                is Optional.Present -> PasswordHasher.hashPassword(password.value)
                is Optional.None -> null
            }
        return database.dbQuery {
            Users
                .updateReturning(where = { Users.id eq id }) {
                    if (email is Optional.Present) it[Users.email] = email.value
                    if (hash != null) it[passwordHash] = hash
                    if (roleId is Optional.Present) it[Users.roleId] = roleId.value
                }.singleOrNull()
                ?.let {
                    UpdateResult.Success(UserDTO(it[Users.id].value, it[Users.email], it[Users.roleId].value))
                } ?: UpdateResult.NotFound
        }
    }

    suspend fun delete(id: UInt) {
        database.dbQuery { Users.deleteWhere { Users.id eq id } }
        log.info("User deleted: id=$id")
    }

    suspend fun findById(id: UInt): UserDTO? =
        database.dbQuery {
            Users
                .selectAll()
                .where { Users.id eq id }
                .map { UserDTO(it[Users.id].value, it[Users.email], it[Users.roleId].value) }
                .singleOrNull()
        }

    suspend fun findByEmail(email: String): UserDTO? =
        database.dbQuery {
            Users
                .selectAll()
                .where { Users.email eq email }
                .map { UserDTO(it[Users.id].value, it[Users.email], it[Users.roleId].value) }
                .singleOrNull()
        }

    suspend fun getAllUsers(pagination: Pagination): List<UserDTO> =
        database.dbQuery {
            Users
                .selectAll()
                .paginate(pagination)
                .toList()
                .map { UserDTO(it[Users.id].value, it[Users.email], it[Users.roleId].value) }
        }
}
