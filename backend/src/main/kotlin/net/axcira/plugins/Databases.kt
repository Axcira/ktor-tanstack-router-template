package net.axcira.plugins

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.suspendTransaction

val skipDatabase = System.getenv("SKIP_DATABASE") == "true"
val host = System.getenv("DB_HOST") ?: "localhost"
val port = System.getenv("DB_PORT")?.toInt() ?: 5432
val dbName = System.getenv("DB_NAME") ?: "postgres"
val user = System.getenv("DB_USER") ?: "postgres"
val pass = System.getenv("DB_PASSWORD") ?: "password"
val url = "jdbc:postgresql://$host:$port/$dbName"

val hikariConfig = HikariConfig().apply {
    this.driverClassName = "org.postgresql.Driver"
    this.jdbcUrl = url
    this.username = user
    this.password = pass

    maximumPoolSize = 3
    isAutoCommit = false
    initializationFailTimeout = if (skipDatabase) 0 else 1
    validate()
}

val dataSource = HikariDataSource(hikariConfig)

val database by lazy {
    if (!skipDatabase) {
        Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().migrate()
    }
    Database.connect(dataSource)
}

fun database() = database

/**
 * Truncates all application tables in the public schema while keeping the schema and
 * Flyway history intact. Faster than Flyway clean + migrate for test isolation.
 */
fun javax.sql.DataSource.truncateAllTables() {
    connection.use { connection ->
        val previousAutoCommit = connection.autoCommit
        try {
            // autoCommit=true so TRUNCATE is its own transaction and cannot race with a
            // later commit on this connection when returned to a pool with isAutoCommit=false.
            connection.autoCommit = true
            connection.createStatement().use { statement ->
                statement.execute(
                    """
                    DO $$
                    DECLARE
                        stmt text;
                    BEGIN
                        SELECT 'TRUNCATE TABLE ' || string_agg(format('%I', tablename), ', ')
                                   || ' RESTART IDENTITY CASCADE'
                        INTO stmt
                        FROM pg_tables
                        WHERE schemaname = 'public'
                          AND tablename <> 'flyway_schema_history';

                        IF stmt IS NOT NULL THEN
                            EXECUTE stmt;
                        END IF;
                    END $$;
                    """.trimIndent()
                )
            }
        } finally {
            connection.autoCommit = previousAutoCommit
        }
    }
}

/**
 * データベースで指定されたブロックを非同期的に実行します。
 * この関数はI/Oスレッドで実行されるように設計されています。
 *
 * @param block 実行するデータベース操作を含むラムダブロック
 * @return ブロックの実行結果
 * @throws Exception 実行中に発生した例外
 */
suspend fun <T> Database.dbQuery(block: suspend Database.() -> T) = withContext(Dispatchers.IO) {
    suspendTransaction(this@dbQuery) {
        block()
    }
}
