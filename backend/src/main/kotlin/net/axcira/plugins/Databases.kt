package net.axcira.plugins

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import net.axcira.features.todos.Todos
import net.axcira.features.users.Users
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

fun database() = run {
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
    Database.connect(HikariDataSource(config))

}

fun Application.configureDatabase() {
    val database: Database by dependencies

    transaction(database) {
        SchemaUtils.create(
            Users,
            Todos,
        )
    }
}
