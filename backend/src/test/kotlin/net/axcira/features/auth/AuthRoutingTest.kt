package net.axcira.features.auth

import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.testing.*
import net.axcira.features.users.CreateUserInput
import net.axcira.plugins.UserSession
import net.axcira.testConfig
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.koin.core.context.GlobalContext.stopKoin
import kotlin.test.assertEquals

class AuthRoutingTest {
    @AfterEach
    fun tearDown() {
        stopKoin()
    }

    @Test
    fun `test login via api`() = testApplication {
        testConfig()
        val client = createClient {
            install(ContentNegotiation) {
                json()
            }
        }

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
