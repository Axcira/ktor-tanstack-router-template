package net.axcira

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.client.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.cookies.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.testing.*
import kotlinx.coroutines.runBlocking
import net.axcira.plugins.truncateAllTables
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.TransactionManager
import org.testcontainers.containers.PostgreSQLContainer
import java.time.Duration

/**
 * Receiver for [test] blocks. Exposes the shared application and a per-test [client]
 * (fresh cookie jar each time) so existing tests keep working unchanged.
 */
class SharedTestContext internal constructor(
    val application: Application,
    client: HttpClient,
) {
    val client: HttpClient = client
}

/**
 * JDBC settings for the suite-scoped Postgres.
 *
 * Stored in system properties so every classloader (Ktor DI reflection vs test code)
 * connects to the **same** container. Without this, DI can resolve a second
 * BaseTestKt/TestDb copy and tests truncate the wrong database.
 */
private data class TestJdbc(
    val url: String,
    val driver: String,
    val user: String,
    val password: String,
)

private const val PROP_URL = "axcira.test.jdbc.url"
private const val PROP_DRIVER = "axcira.test.jdbc.driver"
private const val PROP_USER = "axcira.test.jdbc.user"
private const val PROP_PASSWORD = "axcira.test.jdbc.password"
private const val PROP_MIGRATED = "axcira.test.jdbc.migrated"

/**
 * One Postgres for the whole JVM. Safe to call from any classloader.
 */
private fun sharedTestJdbc(): TestJdbc {
    // Synchronize on a bootstrap class that is shared across app/test classloaders.
    synchronized(System::class.java) {
        val existing = System.getProperty(PROP_URL)
        if (existing != null) {
            return TestJdbc(
                url = existing,
                driver = System.getProperty(PROP_DRIVER)!!,
                user = System.getProperty(PROP_USER)!!,
                password = System.getProperty(PROP_PASSWORD)!!,
            )
        }

        val container =
            PostgreSQLContainer("postgres:18.4").apply {
                withStartupTimeout(Duration.ofMinutes(2))
                start()
            }
        System.setProperty(PROP_URL, container.jdbcUrl)
        System.setProperty(PROP_DRIVER, container.driverClassName)
        System.setProperty(PROP_USER, container.username)
        System.setProperty(PROP_PASSWORD, container.password)

        Runtime.getRuntime().addShutdownHook(
            Thread {
                runCatching { container.stop() }
            },
        )

        return TestJdbc(
            url = container.jdbcUrl,
            driver = container.driverClassName,
            user = container.username,
            password = container.password,
        )
    }
}

/**
 * Per-classloader pool + Exposed Database pointing at [sharedTestJdbc].
 * Multiple pools are OK; they all hit the same Postgres.
 */
private fun createTestDataSource(jdbc: TestJdbc): HikariDataSource =
    HikariDataSource(
        HikariConfig().apply {
            jdbcUrl = jdbc.url
            driverClassName = jdbc.driver
            username = jdbc.user
            password = jdbc.password
            maximumPoolSize = 3
            minimumIdle = 0
            connectionTimeout = 5_000
            validationTimeout = 2_000
            leakDetectionThreshold = 5_000
            isAutoCommit = false
            validate()
        },
    )

private val testDataSource: HikariDataSource by lazy {
    val jdbc = sharedTestJdbc()
    createTestDataSource(jdbc).also { ds ->
        // Migrate once per JVM (not once per classloader pool).
        synchronized(System::class.java) {
            if (System.getProperty(PROP_MIGRATED) != "true") {
                Flyway
                    .configure()
                    .dataSource(ds)
                    .locations("classpath:db/migration")
                    .load()
                    .migrate()
                System.setProperty(PROP_MIGRATED, "true")
            }
        }
        Runtime.getRuntime().addShutdownHook(
            Thread {
                runCatching { ds.close() }
            },
        )
    }
}

/**
 * Shared Exposed Database for this classloader.
 * Ktor DI calls [database] via reflection; tests use [database] property — both must
 * target [sharedTestJdbc] so TRUNCATE and HTTP handlers see the same data.
 */
val database: Database by lazy {
    Database.connect(testDataSource).also { db ->
        Runtime.getRuntime().addShutdownHook(
            Thread {
                runCatching { TransactionManager.closeAndUnregister(db) }
            },
        )
    }
}

/** Factory for Ktor config DI (`net.axcira.BaseTestKt.database`). */
fun database(): Database = database

private val testLock = Any()

/**
 * Runs an integration test against a suite-scoped Ktor app.
 *
 * - DB is truncated before each test for isolation
 * - App is started once and reused across tests
 * - Each test gets a new HttpClient with an empty cookie store
 */
fun test(block: suspend SharedTestContext.(HttpClient) -> Unit) {
    // Serialize tests against the shared app + DB so one test cannot observe another's data.
    synchronized(testLock) {
        runBlocking {
            // Touch DB early so container + migrate exist before the app starts.
            database
            resetDatabase()

            sharedTestApplication.start()
            val application = sharedTestApplication.application

            val client =
                sharedTestApplication.createClient {
                    install(ContentNegotiation) {
                        json()
                    }
                    install(HttpCookies) {
                        storage = AcceptAllCookiesStorage()
                    }
                }

            val context = SharedTestContext(application, client)
            try {
                context.block(client)
            } finally {
                client.close()
            }
        }
    }
}

/**
 * Single TestApplication shared by the whole JVM test process.
 * Schema/migrate is suite-scoped; per-test isolation is TRUNCATE + fresh cookies.
 */
private val sharedTestApplication: TestApplication by lazy {
    // Ensure JDBC system properties are set before DI resolves BaseTestKt.database().
    database
    TestApplication {
        configure("application.yaml", "test.application.yaml")
    }.also { app ->
        Runtime.getRuntime().addShutdownHook(
            Thread {
                runBlocking {
                    runCatching { app.stop() }
                }
            },
        )
    }
}

private fun resetDatabase() {
    // Drop idle pooled connections so no stale transaction can outlive the previous test.
    testDataSource.hikariPoolMXBean?.softEvictConnections()

    // Schema is migrated once at suite startup; per-test isolation uses TRUNCATE.
    // Any pool connected to sharedTestJdbc is fine — same Postgres.
    testDataSource.truncateAllTables()
}
