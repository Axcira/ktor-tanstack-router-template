package net.axcira.features.users

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.features.permissions.Permission
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class UserRoutingTest {
    @Test
    fun `test create user via api`() = test { client ->
        val database: Database by application.dependencies
        // Create test role
        val roleId = database.dbQuery {
            Role.insertAndGetId {
                it[name] = "user-test-role"
                it[description] = "User test role"
                it[permissions] = listOf(Permission.ManageUsers)
            }
        }

        val response = client.post("/api/v1/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("api-test@example.com", "password", roleId.value))
        }

        assertEquals(HttpStatusCode.Created, response.status)
        val user = response.body<UserDTO>()
        assertEquals("api-test@example.com", user.email)
    }
}
