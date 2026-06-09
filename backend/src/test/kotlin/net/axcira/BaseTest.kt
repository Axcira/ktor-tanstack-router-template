package net.axcira

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.client.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.cookies.*
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.request.post
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.testing.*
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import org.testcontainers.containers.PostgreSQLContainer

val isLeyden = System.getenv("IS_LEYDEN").also { println(it) } == "true"
fun test(block: suspend ApplicationTestBuilder.(HttpClient) -> Unit) = testApplication {
    configure("application.yaml", "test.application.yaml")
    if (isLeyden) {
        client = HttpClient {
            install(ContentNegotiation) {
                json()
            }
            install(HttpCookies) {
                storage = AcceptAllCookiesStorage()
            }
            defaultRequest(replace = true) {
                url("http://localhost:8080")
            }
        }
    } else {
        client = createClient {
            install(ContentNegotiation) {
                json()
            }
            install(HttpCookies) {
                storage = AcceptAllCookiesStorage()
            }
        }
    }
    try {
        block(client)
    } finally {
        if (isLeyden) {
            client.post("/api/reset")
        }
    }
}

private fun createPostgresContainer(): PostgreSQLContainer<*> {
    return PostgreSQLContainer("postgres:18.4").apply { start() }
}

val database = if (isLeyden) {
    val url = "jdbc:postgresql://localhost:5432/postgres"
    val dataSource = HikariDataSource(HikariConfig().apply {
        jdbcUrl = url
        driverClassName = "org.postgresql.Driver"
        username = "postgres"
        password = "password"
    })
    Database.connect(dataSource)
} else {
    val postgres = createPostgresContainer()
    val dataSource = HikariDataSource(HikariConfig().apply {
        jdbcUrl = postgres.jdbcUrl
        driverClassName = postgres.driverClassName
        username = postgres.username
        password = postgres.password
    })
    Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().migrate()
    Database.connect(dataSource)
}

fun database() = database
