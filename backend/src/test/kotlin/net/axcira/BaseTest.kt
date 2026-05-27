package net.axcira

import io.ktor.client.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.cookies.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.testing.*
import io.ktor.utils.io.*
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database

@OptIn(InternalAPI::class)
fun test(block: suspend ApplicationTestBuilder.(HttpClient) -> Unit) = testApplication {
    configure("application.yaml", "test.application.yaml")
    client = createClient {
        install(ContentNegotiation) {
            json()
        }
        install(HttpCookies) {
            storage = AcceptAllCookiesStorage()
        }
    }
    block(client)
}

fun database(): Database {
    val url = "jdbc:h2:mem:regular;DB_CLOSE_DELAY=-1"
    Flyway.configure().dataSource(url, "sa", null).locations("classpath:db/migration").load().migrate()

    return Database.connect(url, driver = "org.h2.Driver", user = "sa", password = "")
}
