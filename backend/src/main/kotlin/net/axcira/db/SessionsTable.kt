package net.axcira.db

import org.jetbrains.exposed.v1.core.Table

object SessionsTable : Table() {
    val sessionId = varchar("session_id", 64)
    val session = text("session")

    override val primaryKey = PrimaryKey(sessionId)
}
