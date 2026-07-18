package net.axcira.features.auth

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.features.permissions.Permission
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserService
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class AuthRoutingTest {
    @Test
    fun `test login via api`() = test { client ->
        val database: Database by application.dependencies
        val userService = UserService(database)

        // Create test role
        val roleId = database.dbQuery {
            Role.insertAndGetId {
                it[name] = "auth-test-role"
                it[description] = "Auth test role"
                it[permissions] = listOf(Permission.ManageUsers)
            }
        }

        // Prepare user (no public registration endpoint)
        userService.createUser(CreateUserInput("api-auth@example.com", "password", roleId.value))

        // Login
        client.post("/api/v1/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest("api-auth@example.com", "password"))
        }.let {
            assertEquals(HttpStatusCode.OK, it.status)
            val session = it.body<UserSession>()
            assert(session.user.id > 0u)
        }

        // Access to protected resources
        client.get("/api/v1/users/me").let {
            assertEquals(HttpStatusCode.OK, it.status)
        }

        // Logout
        client.post("/api/v1/auth/logout").let {
            assertEquals(HttpStatusCode.NoContent, it.status)
        }

        // Access to protected resources again
        client.get("/api/v1/users/me").let {
            assertEquals(HttpStatusCode.Unauthorized, it.status)
        }
    }
}
