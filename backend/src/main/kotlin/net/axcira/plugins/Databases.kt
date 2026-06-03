package net.axcira.plugins

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.suspendTransaction

val isLayden = System.getenv("IS_LAYDEN")?.toBoolean() ?: false
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
    validate()
}

val dataSource = HikariDataSource(hikariConfig)

val database by lazy {
    Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").cleanDisabled(!isLayden).load().migrate()
    Database.connect(dataSource)
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
suspend fun <T> Database.dbQuery(block: suspend Database.() -> T) = withContext(Dispatchers.IO) {
    suspendTransaction(this@dbQuery) {
        block()
    }
}
