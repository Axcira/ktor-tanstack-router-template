package net.axcira.features.permissions

import kotlinx.serialization.Serializable
import net.axcira.db.Role
import net.axcira.db.Users
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.selectAll


@Serializable
data class RoleDTO(val id: UInt, val name: String, val description: String, val permissions: List<Permission>)

@Serializable
data class CreateRoleInput(val name: String, val description: String, val permissions: List<Permission>)
@Serializable
data class UpdateRoleInput(val name: String?, val description: String?, val permissions: List<Permission>?)

class PermissionService(val database: Database) {
    /**
     * Get a single role by id.
     */
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
        val updatedRole = Role.selectAll().where{Role.id eq id}.singleOrNull() ?: return@dbQuery null
        Role.insertReturning {
            it[name] = updatedRole[Role.name]
            it[description] = updatedRole[Role.description]
            it[permissions] = updatedRole[Role.permissions]
        }.single().let {
            RoleDTO(it[Role.id].value, it[Role.name], it[Role.description], it[Role.permissions])
        }
    }


    suspend fun delete(id: UInt, fallbackRoleId: UInt): Int = database.dbQuery {
        Role.deleteWhere { Role.id eq id }
    }
}
