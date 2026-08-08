package net.axcira.features.health

import kotlinx.serialization.Serializable
import net.axcira.plugins.dbQuery
import net.axcira.plugins.skipDatabase
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.TransactionManager
import org.slf4j.LoggerFactory

@Serializable
data class HealthResponse(
    val status: String,
    val database: String,
)

class HealthService(
    private val database: Database,
) {
    private val log = LoggerFactory.getLogger(HealthService::class.java)

    /**
     * Liveness/readiness-style check: pings the injected database with `SELECT 1`.
     * When [skipDatabase] is set and the ping fails (OpenAPI codegen), reports `database=skipped`
     * so tooling stays healthy without a live Postgres.
     */
    suspend fun check(): HealthResponse =
        try {
            database.dbQuery {
                TransactionManager.current().exec("SELECT 1")
            }
            HealthResponse(status = "ok", database = "up")
        } catch (e: Exception) {
            if (skipDatabase) {
                log.debug("Database ping skipped (SKIP_DATABASE): {}", e.message)
                HealthResponse(status = "ok", database = "skipped")
            } else {
                log.warn("Database ping failed: {}", e.message)
                HealthResponse(status = "unhealthy", database = "down")
            }
        }
}
