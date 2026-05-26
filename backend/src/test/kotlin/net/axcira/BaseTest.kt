package net.axcira

import io.ktor.client.HttpClient
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.testing.*
import io.ktor.utils.io.*
import org.jetbrains.exposed.v1.jdbc.Database

@OptIn(InternalAPI::class)
fun test(block: suspend ApplicationTestBuilder.(HttpClient) -> Unit) = testApplication {
    configure("application.yaml", "test.application.yaml")
    val client = createClient {
        install(ContentNegotiation) {
            json()
        }
    }
    block(client)
}

fun database() = Database.connect("jdbc:h2:mem:regular;DB_CLOSE_DELAY=-1")
