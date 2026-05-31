package net.axcira.features.auth

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.sessions.*
import kotlinx.serialization.Serializable
import net.axcira.db.*
import net.axcira.db.SessionsTable.sessionId
import net.axcira.features.permissions.Permission
import net.axcira.features.users.UserDTO
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*


@Serializable
data class UserSession(val user: UserDTO, val permissions: List<Permission>)

class DatabaseSessionStorage(private val database: Database) : SessionStorage {
    override suspend fun invalidate(id: String) {
        database.dbQuery {
            SessionsTable.deleteWhere { sessionId eq id }
        }
    }

    override suspend fun read(id: String): String {
        return database.dbQuery {
            SessionsTable.select(SessionsTable.session).where { sessionId eq id }.singleOrNull()?.get(SessionsTable.session)
                ?: throw NoSuchElementException("Session $id not found")
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

fun Application.configureAuthentication() {
    val database: Database by dependencies
    install(Sessions) {
        cookie<UserSession>("user_session", DatabaseSessionStorage(database)) {
            cookie.path = "/"
            cookie.httpOnly = true
            cookie.secure = (System.getenv("environment") ?: "development") == "production"
        }
    }
    install(Authentication) {
        session<UserSession> {
            validate { session ->
                database.dbQuery {
                    (Users innerJoin Role).selectAll().where { Users.id eq session.user.id }.singleOrNull()?.let {
                        UserSession(
                            UserDTO(
                                it[Users.id].value, it[Users.email], it[Users.roleId].value
                            ), it[Role.permissions]
                        )
                    }
                }
            }
        }
    }
}
