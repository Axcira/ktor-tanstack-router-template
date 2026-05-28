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
import org.testcontainers.containers.PostgreSQLContainer

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

val postgres = PostgreSQLContainer("postgres:18.4").apply { start() }
val database = run {
    val url = postgres.jdbcUrl
    val dataSource = HikariDataSource(HikariConfig().apply {
        jdbcUrl = url
        driverClassName = postgres.driverClassName
        username = postgres.username
        password = postgres.password
    })
    Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().migrate()
    Database.connect(dataSource)
}
fun database() = database
