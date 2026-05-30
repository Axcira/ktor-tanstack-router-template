package net.axcira.features.permissions

import kotlinx.serialization.Serializable
import net.axcira.db.Role
import net.axcira.db.Users
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*


@Serializable
data class RoleDTO(val id: UInt, val name: String, val description: String, val permissions: List<Permission>)

@Serializable
data class CreateRoleInput(val name: String, val description: String, val permissions: List<Permission>)
@Serializable
data class UpdateRoleInput(val name: String?, val description: String?, val permissions: List<Permission>?)

class PermissionService(val database: Database) {

    suspend fun getRoleById(id: UInt): RoleDTO? = database.dbQuery {
        val role = Role.selectAll().where {Role.id eq id}.singleOrNull()?:return@dbQuery null
        RoleDTO(role[Role.id].value, role[Role.name], role[Role.description], role[Role.permissions])
    }

    suspend fun getPermissionsForUser(userId: UInt): List<Permission>? = database.dbQuery {
        val user = (Users innerJoin Role).selectAll().where{ Users.id eq userId }.singleOrNull() ?: return@dbQuery null
        user[Role.permissions]
    }


    suspend fun create(role: CreateRoleInput): RoleDTO = database.dbQuery {
        val createdRole = Role.insertReturning {
            it[name]= role.name
            it[description] = role.description
            it[permissions] = role.permissions
        }.single()
        RoleDTO(createdRole[Role.id].value,createdRole[Role.name],createdRole[Role.description],createdRole[Role.permissions])
    }

    suspend fun update(id: UInt, updateRoleInput: UpdateRoleInput): RoleDTO? = database.dbQuery {
        if (updateRoleInput.name == null &&
            updateRoleInput.description == null &&
            updateRoleInput.permissions == null) return@dbQuery null

        val updatedRole = Role.updateReturning(where = { Role.id eq id }) {
            if (updateRoleInput.name != null) it[Role.name] = updateRoleInput.name
            if (updateRoleInput.description != null) it[Role.description] = updateRoleInput.description
            if (updateRoleInput.permissions != null) it[Role.permissions] = updateRoleInput.permissions
        }.singleOrNull()?: return@dbQuery null
            RoleDTO(updatedRole[Role.id].value,updatedRole[Role.name],updatedRole[Role.description],updatedRole[Role.permissions])
    }

    suspend fun delete(id: UInt, fallbackRoleId: UInt): Int = database.dbQuery {
        Role.deleteWhere { Role.id eq id }
        Users.update({ Users.roleId eq id }) { it[Users.roleId] = fallbackRoleId }
    }
}
