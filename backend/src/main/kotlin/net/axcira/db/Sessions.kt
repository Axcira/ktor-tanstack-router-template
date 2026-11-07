package net.axcira.db

import org.jetbrains.exposed.v1.core.Table

object Sessions : Table() {
    val sessionId = varchar("session_id", 64)
    val session = text("session")
    val userId = uinteger("user_id").nullable()
    val expiresAt = long("expires_at").nullable()

    override val primaryKey = PrimaryKey(sessionId)

    init {
        index("sessions_user_id", false, userId)
        index("sessions_expires_at", false, expiresAt)
    }
}
