package net.axcira

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.client.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.cookies.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.testing.*
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.core.DatabaseConfig
import org.jetbrains.exposed.v1.core.vendors.PostgreSQLDialect
import org.jetbrains.exposed.v1.jdbc.Database

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
    val url = "jdbc:h2:mem:regular;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH"
    val dataSource = HikariDataSource(HikariConfig().apply {
        jdbcUrl = url
        driverClassName = "org.h2.Driver"
        username = "sa"
        password = ""
    })

    Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().migrate()

    return Database.connect(dataSource, databaseConfig = DatabaseConfig {
        explicitDialect = PostgreSQLDialect()
    })
}
