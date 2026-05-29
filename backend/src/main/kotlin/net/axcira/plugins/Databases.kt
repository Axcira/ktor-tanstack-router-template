package net.axcira.plugins

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.suspendTransaction

val database by lazy {
    val host = System.getenv("DB_HOST") ?: "localhost"
    val port = System.getenv("DB_PORT")?.toInt() ?: 5432
    val dbName = System.getenv("DB_NAME") ?: "postgres"
    val user = System.getenv("DB_USER") ?: "postgres"
    val password = System.getenv("DB_PASSWORD") ?: "password"
    val jdbcUrl = "jdbc:postgresql://$host:$port/$dbName"

    val config = HikariConfig().apply {
        this.driverClassName = "org.postgresql.Driver"
        this.jdbcUrl = jdbcUrl
        this.username = user
        this.password = password

        maximumPoolSize = 3
        isAutoCommit = false
        validate()
    }
    val datasource = HikariDataSource(config)
    Flyway.configure().dataSource(datasource).locations("classpath:db/migration").load().migrate()
    Database.connect(datasource)
}

fun database() = database

/**
 * データベースで指定されたブロックを非同期的に実行します。
 * この関数はI/Oスレッドで実行されるように設計されています。
 *
 * @param block 実行するデータベース操作を含むラムダブロック
 * @return ブロックの実行結果
 * @throws Exception 実行中に発生した例外
 */
suspend fun <T> Database.dbQuery(block: Database.() -> T) = withContext(Dispatchers.IO) {
    suspendTransaction(this@dbQuery) {
        block()
    }
}
