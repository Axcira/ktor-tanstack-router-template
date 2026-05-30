package net.axcira.db

import kotlinx.serialization.json.Json
import net.axcira.features.permissions.Permission
import org.jetbrains.exposed.v1.core.dao.id.UIntIdTable
import org.jetbrains.exposed.v1.json.json

private val format = Json { ignoreUnknownKeys = true }

object Role : UIntIdTable() {
    val name = varchar("name", 255)
    val description = text("description")
    val permissions = json<List<Permission>>("permissions", format)
}
