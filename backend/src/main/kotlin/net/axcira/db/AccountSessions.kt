package net.axcira.db

import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/**
 * One signed-in account inside a device session.
 *
 * [accountIndex] is stable until the row is revoked. New sign-ins take the lowest free index.
 * Timestamps are epoch milliseconds. [revokedAt] is set on logout or expiry so the index can be reused.
 */
object AccountSessions : Table("account_sessions") {
    val id = long("id").autoIncrement()
    val deviceSessionId = varchar("device_session_id", 64)
    val accountIndex = integer("account_index")
    val userId = uinteger("user_id").references(Users.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = long("created_at")
    val expiresAt = long("expires_at")
    val revokedAt = long("revoked_at").nullable()
    val activatedAt = long("activated_at")

    override val primaryKey = PrimaryKey(id)

    init {
        index("account_sessions_device_session_id", false, deviceSessionId)
        index("account_sessions_user_id", false, userId)
    }
}
