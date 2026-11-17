package net.axcira.db

import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table

/**
 * One signed-in account inside a device session.
 *
 * [accountIndex] stays occupied while the row is visible. New sign-ins take the lowest free index.
 * Timestamps are epoch milliseconds. [requiresReauth] keeps a slot that must sign in again.
 * [revokedAt] is set when that account signs out, which frees the index.
 */
object AccountSessions : Table("account_sessions") {
    val id = long("id").autoIncrement()
    val deviceSessionId = varchar("device_session_id", 64)
    val accountIndex = integer("account_index")
    val userId = uinteger("user_id").references(Users.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = long("created_at")
    val expiresAt = long("expires_at")
    val revokedAt = long("revoked_at").nullable()
    val requiresReauth = bool("requires_reauth")
    val activatedAt = long("activated_at")

    override val primaryKey = PrimaryKey(id)

    init {
        index("account_sessions_device_session_id", false, deviceSessionId)
        index("account_sessions_user_id", false, userId)
    }
}
