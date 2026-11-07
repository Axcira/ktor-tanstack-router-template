package net.axcira.features.permissions

import kotlinx.serialization.Serializable
import net.axcira.*
import net.axcira.db.Roles
import net.axcira.db.Users
import net.axcira.plugins.Optional
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.*
import org.slf4j.LoggerFactory

@Serializable
data class RoleDTO(
    val id: UInt,
    val name: String,
    val description: String,
    val permissions: List<Permission>,
)

@Serializable
data class CreateRoleInput(
    val name: String,
    val description: String,
    val permissions: List<Permission>,
)

@Serializable
data class UpdateRoleInput(
    val name: Optional<String> = Optional.None,
    val description: Optional<String> = Optional.None,
    val permissions: Optional<List<Permission>> = Optional.None,
)

/**
 * Outcome of updating a role after locking the target row and checking the caller's permission hierarchy.
 */
sealed interface UpdateRoleResult {
    data class Success(
        val value: RoleDTO,
    ) : UpdateRoleResult

    data object NotFound : UpdateRoleResult

    data object NotModified : UpdateRoleResult

    data object Forbidden : UpdateRoleResult
}

/**
 * Outcome of deleting a role and reassigning its users to a fallback role inside a single transaction.
 */
sealed interface DeleteRoleResult {
    data object Success : DeleteRoleResult

    data object NotFound : DeleteRoleResult

    data object FallbackNotFound : DeleteRoleResult

    data object Forbidden : DeleteRoleResult
}

class PermissionService(
    val database: Database,
) {
    private val log = LoggerFactory.getLogger(PermissionService::class.java)

    suspend fun getAllRoles(pagination: Pagination): List<RoleDTO> =
        database.dbQuery {
            Roles.selectAll().paginate(pagination).map {
                RoleDTO(it[Roles.id].value, it[Roles.name], it[Roles.description], it[Roles.permissions])
            }
        }

    suspend fun getRoleByName(name: String): RoleDTO? =
        database.dbQuery {
            Roles.selectAll().where { Roles.name eq name }.firstOrNull()?.let {
                RoleDTO(it[Roles.id].value, it[Roles.name], it[Roles.description], it[Roles.permissions])
            }
        }

    suspend fun getRoleById(id: UInt): RoleDTO? =
        database.dbQuery {
            val role = Roles.selectAll().where { Roles.id eq id }.singleOrNull() ?: return@dbQuery null
            RoleDTO(role[Roles.id].value, role[Roles.name], role[Roles.description], role[Roles.permissions])
        }

    suspend fun getPermissionsForUser(userId: UInt): List<Permission>? =
        database.dbQuery {
            val user = (Users innerJoin Roles).selectAll().where { Users.id eq userId }.singleOrNull() ?: return@dbQuery null
            user[Roles.permissions]
        }

    suspend fun create(role: CreateRoleInput): RoleDTO =
        database.dbQuery {
            val createdRole =
                Roles
                    .insertReturning {
                        it[name] = role.name
                        it[description] = role.description
                        it[permissions] = role.permissions
                    }.single()
            val dto =
                RoleDTO(
                    createdRole[Roles.id].value,
                    createdRole[Roles.name],
                    createdRole[Roles.description],
                    createdRole[Roles.permissions],
                )
            log.info("Role created: id=${dto.id}, name=\"${dto.name}\"")
            dto
        }

    /**
     * Locks the role with [id], verifies that [callerPermissions] satisfies both the current role's
     * permissions and any replacement permissions in [updateRoleInput], and applies the update atomically.
     */
    suspend fun update(
        id: UInt,
        updateRoleInput: UpdateRoleInput,
        callerPermissions: List<Permission>,
    ): UpdateRoleResult =
        database.dbQuery {
            val existing =
                Roles
                    .selectAll()
                    .where { Roles.id eq id }
                    .forUpdate()
                    .singleOrNull()
                    ?: return@dbQuery UpdateRoleResult.NotFound

            if (!callerPermissions.satisfiesAll(existing[Roles.permissions])) {
                return@dbQuery UpdateRoleResult.Forbidden
            }

            if (updateRoleInput.permissions is Optional.Present &&
                !callerPermissions.satisfiesAll(updateRoleInput.permissions.value)
            ) {
                return@dbQuery UpdateRoleResult.Forbidden
            }

            if (arrayOf(
                    updateRoleInput.name,
                    updateRoleInput.description,
                    updateRoleInput.permissions,
                ).all { it == Optional.None }
            ) {
                return@dbQuery UpdateRoleResult.NotModified
            }

            val (name, description, permissions) = updateRoleInput
            Roles
                .updateReturning(where = { Roles.id eq id }) {
                    if (name is Optional.Present) it[Roles.name] = name.value
                    if (description is Optional.Present) it[Roles.description] = description.value
                    if (permissions is Optional.Present) it[Roles.permissions] = permissions.value
                }.singleOrNull()
                ?.let {
                    UpdateRoleResult.Success(
                        RoleDTO(it[Roles.id].value, it[Roles.name], it[Roles.description], it[Roles.permissions]),
                    )
                } ?: UpdateRoleResult.NotFound
        }

    /**
     * Locks both [id] and [fallbackRoleId] in ascending ID order, verifies that [callerPermissions]
     * satisfies both roles' permissions, reassigns users from [id] to [fallbackRoleId], and deletes [id]
     * within a single transaction.
     */
    suspend fun delete(
        id: UInt,
        fallbackRoleId: UInt,
        callerPermissions: List<Permission>,
    ): DeleteRoleResult {
        require(id != fallbackRoleId) { "Cannot fallback to the same role being deleted (id: $id)" }
        return database
            .dbQuery {
                val lockedRoles =
                    Roles
                        .selectAll()
                        .where { Roles.id inList listOf(id, fallbackRoleId) }
                        .orderBy(Roles.id)
                        .forUpdate()
                        .associateBy { it[Roles.id].value }

                val fallbackRole = lockedRoles[fallbackRoleId] ?: return@dbQuery DeleteRoleResult.FallbackNotFound
                val targetRole = lockedRoles[id] ?: return@dbQuery DeleteRoleResult.NotFound

                if (!callerPermissions.satisfiesAll(targetRole[Roles.permissions]) ||
                    !callerPermissions.satisfiesAll(fallbackRole[Roles.permissions])
                ) {
                    return@dbQuery DeleteRoleResult.Forbidden
                }

                Users.update({ Users.roleId eq id }) { it[roleId] = fallbackRoleId }
                Roles.deleteWhere { Roles.id eq id }
                DeleteRoleResult.Success
            }.also { result ->
                if (result is DeleteRoleResult.Success) {
                    log.info("Role deleted: id=$id, fallbackRoleId=$fallbackRoleId")
                }
            }
    }

    suspend fun exists(roleId: UInt): Boolean =
        database.dbQuery {
            Roles
                .selectAll()
                .where { Roles.id eq roleId }
                .limit(1)
                .count() > 0
        }
}
