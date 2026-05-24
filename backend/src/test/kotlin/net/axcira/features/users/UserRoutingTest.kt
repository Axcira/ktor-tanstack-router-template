package net.axcira.features.users

import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.testing.*
import net.axcira.testConfig
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.koin.core.context.GlobalContext.stopKoin
import kotlin.test.assertEquals

class UserRoutingTest {
    @AfterEach
    fun tearDown() {
        stopKoin()
    }

    @Test
    fun `test create user via api`() = testApplication {
        testConfig()
        val client = createClient {
            install(ContentNegotiation) {
                json()
            }
        }

        val response = client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("api-test@example.com", "password"))
        }

        assertEquals(HttpStatusCode.Created, response.status)
        val user = response.body<UserDTO>()
        assertEquals("api-test@example.com", user.email)
    }
}
