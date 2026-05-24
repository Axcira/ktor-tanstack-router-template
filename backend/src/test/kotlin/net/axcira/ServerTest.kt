package net.axcira

import io.ktor.client.request.*
import io.ktor.http.*
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class ServerTest {
    @Test
    fun `test root endpoint`() = test {
        // verify server root returns 200
        assertEquals(HttpStatusCode.OK, client.get("/api/").status)
    }
}
