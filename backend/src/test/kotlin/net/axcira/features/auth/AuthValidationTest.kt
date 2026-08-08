package net.axcira.features.auth

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import net.axcira.test
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AuthValidationTest {
    @Test
    fun `login rejects blank email`() =
        test { client ->
            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("", "password"))
                }.let { response ->
                    assertEquals(HttpStatusCode.BadRequest, response.status)
                    val body = response.bodyAsText()
                    assertTrue(body.contains("email"), "expected email validation reason in: $body")
                }
        }

    @Test
    fun `login rejects short password`() =
        test { client ->
            client
                .post("/api/v1/auth/login") {
                    contentType(ContentType.Application.Json)
                    setBody(LoginRequest("user@example.com", "short"))
                }.let { response ->
                    assertEquals(HttpStatusCode.BadRequest, response.status)
                    val body = response.bodyAsText()
                    assertTrue(body.contains("password"), "expected password validation reason in: $body")
                }
        }
}
