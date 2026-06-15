package net.axcira.features.permissions

import kotlinx.serialization.Serializable
import net.axcira.*
import net.axcira.db.Role
import net.axcira.db.Users
import net.axcira.plugins.Optional
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*
import org.slf4j.LoggerFactory


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

class PermissionService(val database: Database) {
    private val log = LoggerFactory.getLogger(PermissionService::class.java)
    suspend fun getAllRoles(pagination: Pagination): List<RoleDTO> = database.dbQuery {
        Role.selectAll().paginate(pagination).map { RoleDTO(it[Role.id].value, it[Role.name], it[Role.description], it[Role.permissions]) }
    }

    suspend fun getRoleByName(name: String): RoleDTO? = database.dbQuery {
        Role.selectAll().where { Role.name eq name }.firstOrNull()?.let {
            RoleDTO(it[Role.id].value, it[Role.name], it[Role.description], it[Role.permissions])
        }
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
        val dto = RoleDTO(createdRole[Role.id].value, createdRole[Role.name], createdRole[Role.description], createdRole[Role.permissions])
        log.info("Role created: id=${dto.id}, name=\"${dto.name}\"")
        dto
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

    suspend fun delete(id: UInt, fallbackRoleId: UInt): Int {
        require(id != fallbackRoleId) { "Cannot fallback to the same role being deleted (id: $id)" }
        return database.dbQuery {
            Users.update({ Users.roleId eq id }) { it[roleId] = fallbackRoleId }
            Role.deleteWhere { Role.id eq id }
        }.also {
            log.info("Role deleted: id=$id, fallbackRoleId=$fallbackRoleId")
        }
    }

    suspend fun exists(roleId: UInt): Boolean {
        return database.dbQuery {
            Role.selectAll().where { Role.id eq roleId }.limit(1).count() > 0
        }
    }
}
