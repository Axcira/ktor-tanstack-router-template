package net.axcira.features.auth

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.sessions.*
import kotlinx.serialization.Serializable
import net.axcira.features.auth.SessionsTable.sessionId
import net.axcira.features.users.Users
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*


@Serializable
data class UserSession(val userId: UInt)

object SessionsTable : Table() {
    val sessionId = varchar("session_id", 64)
    val session = text("session")

    override val primaryKey = PrimaryKey(sessionId)
}

class DatabaseSessionStorage(private val database: Database) : SessionStorage {
    override suspend fun invalidate(id: String) {
        database.dbQuery {
            SessionsTable.deleteWhere { sessionId eq id }
        }
    }

    override suspend fun read(id: String): String {
        return database.dbQuery {
            SessionsTable.select(SessionsTable.session).where { sessionId eq id }.single()[SessionsTable.session]
        }
    }

    override suspend fun write(id: String, value: String) {
        database.dbQuery {
            SessionsTable.upsert {
                it[sessionId] = id
                it[session] = value
            }
        }
    }
}

fun Application.configureAuthentication(database: Database) {
    install(Sessions) {
        cookie<UserSession>("user_session", DatabaseSessionStorage(database)) {
            cookie.path = "/"
            cookie.httpOnly = true
            cookie.secure = true
        }
    }
    install(Authentication) {
        session<UserSession> {
            validate { session ->
                val user = database.dbQuery {
                    Users.selectAll().where { Users.id eq session.userId }.firstOrNull()
                }
                user?.let { session }
            }
        }
    }
}
