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
import java.time.Duration

/**
 * Shared-schema test infrastructure.
 *
 * All tests in this project share a single PostgreSQL schema and run sequentially
 * (no parallel execution). Each test gets a clean schema via Flyway clean+migrate
 * before it runs.  Tests MUST NOT be parallelized without per-test schema isolation.
 */
val isLeyden = System.getenv("IS_LEYDEN") == "true"

fun test(block: suspend ApplicationTestBuilder.(HttpClient) -> Unit) {
    if (!isLeyden) {
        resetDatabase()
    }
    testApplication {
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
}

/** Whether to reuse the Testcontainers PostgreSQL between local runs (opt-in). */
private val containerReuse = System.getenv("TESTCONTAINERS_REUSE")?.toBoolean() ?: false

private fun createPostgresContainer(): PostgreSQLContainer<*> {
    return PostgreSQLContainer("postgres:18.4").apply {
        withStartupTimeout(Duration.ofMinutes(2))
        withReuse(containerReuse)
        start()
    }
}

private val postgresContainer = if (isLeyden) null else createPostgresContainer()

private val testDataSource = HikariDataSource(HikariConfig().apply {
    if (isLeyden) {
        jdbcUrl = "jdbc:postgresql://localhost:5432/postgres"
        driverClassName = "org.postgresql.Driver"
        username = "postgres"
        password = "password"
    } else {
        jdbcUrl = postgresContainer!!.jdbcUrl
        driverClassName = postgresContainer.driverClassName
        username = postgresContainer.username
        password = postgresContainer.password
    }
})

val database = run {
    if (!isLeyden) {
        Flyway.configure().dataSource(testDataSource).locations("classpath:db/migration").load().migrate()
    }
    Database.connect(testDataSource)
}

private fun resetDatabase() {
    Flyway.configure().dataSource(testDataSource).locations("classpath:db/migration").cleanDisabled(false).load().apply {
        clean()
        migrate()
    }
}

fun database() = database
