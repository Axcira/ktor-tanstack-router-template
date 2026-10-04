package net.axcira.db

import org.jetbrains.exposed.v1.core.Table

object SessionsTable : Table() {
    val sessionId = varchar("session_id", 64)
    val session = text("session")
    val userId = uinteger("user_id").nullable()

    override val primaryKey = PrimaryKey(sessionId)

    init {
        index("sessions_user_id", false, userId)
    }
}
