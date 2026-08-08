package net.axcira.features.health

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import net.axcira.test
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class HealthRoutingTest {
    @Test
    fun `health reports ok when database is up`() =
        test { client ->
            client.get("/api/v1/health").let { response ->
                assertEquals(HttpStatusCode.OK, response.status)
                val body = response.body<HealthResponse>()
                assertEquals("ok", body.status)
                assertEquals("up", body.database)
            }
        }
}
