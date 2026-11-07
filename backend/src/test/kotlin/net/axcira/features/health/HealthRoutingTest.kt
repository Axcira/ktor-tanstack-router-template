package net.axcira.features.health

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import net.axcira.assertStatus
import net.axcira.test
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class HealthRoutingTest {
    @Test
    fun `health reports ok when database is up`() =
        test { client ->
            val body =
                client
                    .get("/api/v1/health")
                    .assertStatus(HttpStatusCode.OK)
                    .body<HealthResponse>()
            assertEquals("ok", body.status)
            assertEquals("up", body.database)
        }
}
