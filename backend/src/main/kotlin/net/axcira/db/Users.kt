package net.axcira.db

import org.jetbrains.exposed.v1.core.dao.id.UIntIdTable

object Users : UIntIdTable() {
    val email = varchar("email", length = 50).uniqueIndex()
    val passwordHash = varchar("password_hash", length = 128)

    val roleId = reference("role_id", Role)
}
