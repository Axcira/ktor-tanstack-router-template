package net.axcira.features.permissions

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.jdbc.Database

@Serializable
data class RoleDTO(val id: UInt, val name: String, val description: String, val permissions: List<Permission>)

class PermissionService(val database: Database) {
    /**
     * Get a single role by id.
     */
    suspend fun getRoleById(id: UInt): RoleDTO = TODO()

    /**
     * Get all permissions based on the user id.
     */
    suspend fun getPermissionsForUser(userId: UInt): List<Permission> = TODO()

    /**
     * Create a new role.
     */
    suspend fun create(name: String, permissions: List<Permission>): RoleDTO = TODO()

    /**
     * Update an existing role.
     */
    suspend fun update(id: UInt, name: String, permissions: List<Permission>): RoleDTO = TODO()

    /**
     * Delete a role. Since the user can't have a deleted role anymore, we need to provide fallback role id.
     */
    suspend fun delete(id: UInt, fallbackRoleId: UInt): Int = TODO()
}
