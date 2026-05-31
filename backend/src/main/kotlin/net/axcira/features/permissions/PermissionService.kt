package net.axcira.features.permissions

import kotlinx.serialization.Serializable
import net.axcira.UpdateResult
import net.axcira.db.Role
import net.axcira.db.Users
import net.axcira.plugins.Optional
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*


@Serializable
data class RoleDTO(val id: UInt, val name: String, val description: String, val permissions: List<Permission>)

@Serializable
data class CreateRoleInput(val name: String, val description: String, val permissions: List<Permission>)

@Serializable
data class UpdateRoleInput(
    val name: Optional<String> = Optional.None,
    val description: Optional<String> = Optional.None,
    val permissions: Optional<List<Permission>> = Optional.None
)

@Serializable
data class DeleteRoleInput(val fallbackRoleId: UInt)

class PermissionService(val database: Database) {
    suspend fun getAllRoles(): List<RoleDTO> = database.dbQuery {
        Role.selectAll().map { RoleDTO(it[Role.id].value, it[Role.name], it[Role.description], it[Role.permissions]) }
    }

    suspend fun getRoleById(id: UInt): RoleDTO? = database.dbQuery {
        val role = Role.selectAll().where { Role.id eq id }.singleOrNull() ?: return@dbQuery null
        RoleDTO(role[Role.id].value, role[Role.name], role[Role.description], role[Role.permissions])
    }

    suspend fun getPermissionsForUser(userId: UInt): List<Permission>? = database.dbQuery {
        val user = (Users innerJoin Role).selectAll().where { Users.id eq userId }.singleOrNull() ?: return@dbQuery null
        user[Role.permissions]
    }

    suspend fun create(role: CreateRoleInput): RoleDTO = database.dbQuery {
        val createdRole = Role.insertReturning {
            it[name] = role.name
            it[description] = role.description
            it[permissions] = role.permissions
        }.single()
        RoleDTO(createdRole[Role.id].value, createdRole[Role.name], createdRole[Role.description], createdRole[Role.permissions])
    }

    suspend fun update(id: UInt, updateRoleInput: UpdateRoleInput): UpdateResult<RoleDTO> = database.dbQuery {
        if (arrayOf(
                updateRoleInput.name,
                updateRoleInput.description,
                updateRoleInput.permissions,
            ).all { it == Optional.None }
        ) return@dbQuery UpdateResult.NotModified

        val (name, description, permissions) = updateRoleInput
        return@dbQuery Role.updateReturning(where = { Role.id eq id }) {
            if (name is Optional.Present) it[Role.name] = name.value
            if (description is Optional.Present) it[Role.description] = description.value
            if (permissions is Optional.Present) it[Role.permissions] = permissions.value
        }.singleOrNull()?.let {
            UpdateResult.Success(
                RoleDTO(it[Role.id].value, it[Role.name], it[Role.description], it[Role.permissions])
            )
        } ?: UpdateResult.NotFound
    }

    suspend fun delete(id: UInt, deleteRoleInput: DeleteRoleInput): Int = database.dbQuery {
        Users.update({ Users.roleId eq id }) { it[Users.roleId] = deleteRoleInput.fallbackRoleId }
        Role.deleteWhere { Role.id eq id }
    }
}
