package net.axcira.features.version

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import net.axcira.assertStatus
import net.axcira.test
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class VersionRoutingTest {
    @Test
    fun `version is public and returns backend identity`() =
        test { client ->
            client.get("/api/v1/version").let { response ->
                response.assertStatus(HttpStatusCode.OK)
                assertEquals("no-store", response.headers[HttpHeaders.CacheControl])
                val body = response.body<VersionResponse>()
                assertNotEquals("", body.commit)
                assertNotEquals("", body.commitShort)
                assertNotEquals("", body.builtAt)
                assertTrue(body.commitShort.length <= 7 || body.commit == "unknown")
                assertNull(body.frontend)
            }
        }
}
