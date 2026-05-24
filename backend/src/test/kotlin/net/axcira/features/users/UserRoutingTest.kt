package net.axcira.features.users

import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import net.axcira.test
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class UserRoutingTest {
    @Test
    fun `test create user via api`() = test {
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
