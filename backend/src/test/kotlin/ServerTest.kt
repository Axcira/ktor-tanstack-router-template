package net.axcira

import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals

class ServerTest {
    @Test
    fun `test root endpoint`() = testApplication {
        // loads default configuration
        configure()
        // verify server root returns 200
        assertEquals(HttpStatusCode.OK, client.get("/").status)
    }
}
