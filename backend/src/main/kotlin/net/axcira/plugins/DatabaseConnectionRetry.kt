package net.axcira.plugins

import org.slf4j.LoggerFactory
import java.sql.DriverManager
import java.sql.SQLException

private val log = LoggerFactory.getLogger("DatabaseConnection")

/** Delays between connection attempts (ms), after each failed try. */
val databaseConnectionRetryDelaysMs = listOf(1_000L, 3_000L, 5_000L, 10_000L, 30_000L)

typealias JdbcConnect = (jdbcUrl: String, username: String, password: String) -> Unit

internal fun awaitJdbcConnectivity(
    jdbcUrl: String,
    username: String,
    password: String,
    delaysMs: List<Long> = databaseConnectionRetryDelaysMs,
    connect: JdbcConnect = ::defaultJdbcConnect,
    sleeper: (Long) -> Unit = { Thread.sleep(it) },
) {
    var last: Exception? = null
    val maxAttempts = delaysMs.size + 1
    for (attempt in 0 until maxAttempts) {
        try {
            log.info("Database connection attempt {}/{} ({})", attempt + 1, maxAttempts, jdbcUrl)
            connect(jdbcUrl, username, password)
            log.info("Database connection established on attempt {}", attempt + 1)
            return
        } catch (e: Exception) {
            last = e
            log.warn("Database connection attempt {}/{} failed: {}", attempt + 1, maxAttempts, e.message)
            if (attempt < delaysMs.size) {
                sleeper(delaysMs[attempt])
            }
        }
    }
    throw SQLException("Failed to connect to database after $maxAttempts attempts", last)
}

private fun defaultJdbcConnect(
    jdbcUrl: String,
    username: String,
    password: String,
) {
    DriverManager.getConnection(jdbcUrl, username, password).use { connection ->
        require(connection.isValid(5)) { "JDBC connection reported invalid" }
    }
}
