package net.axcira.features.permissions

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.jdbc.Database

@Serializable
data class RoleDTO(val id: UInt, val name: String, val description: String, val permissions: List<Permission>)

class PermissionService(val database: Database) {
    suspend fun getRoleById(id: UInt): RoleDTO = TODO()
    suspend fun getPermissionsForUser(userId: UInt): List<Permission> = TODO()
    suspend fun create(name: String, permissions: List<Permission>): RoleDTO = TODO()
    suspend fun update(id: UInt, name: String, permissions: List<Permission>): RoleDTO = TODO()
    suspend fun delete(id: UInt): Int = TODO()
}
