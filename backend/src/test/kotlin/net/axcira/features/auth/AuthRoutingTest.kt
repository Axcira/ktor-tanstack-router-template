package net.axcira.features.auth

import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import net.axcira.features.users.CreateUserInput
import net.axcira.test
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class AuthRoutingTest {
    @Test
    fun `test login via api`() = test { client ->
        // Prepare user
        client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("api-auth@example.com", "password"))
        }

        // Login
        val response = client.post("/api/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest("api-auth@example.com", "password"))
        }

        assertEquals(HttpStatusCode.OK, response.status)
        val session = response.body<UserSession>()
        assert(session.userId > 0u)
    }
}
