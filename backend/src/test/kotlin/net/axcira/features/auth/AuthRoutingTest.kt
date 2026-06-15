package net.axcira.features.auth

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import net.axcira.features.users.CreateUserInput
import net.axcira.test
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class AuthRoutingTest {
    @Test
    fun `test login via api`() = test { client ->
        // Prepare user
        client.post("/api/v1/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("api-auth@example.com", "password", 1u))
        }

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
