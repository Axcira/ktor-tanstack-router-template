package net.axcira.plugins

import io.ktor.server.application.*
import net.axcira.features.users.Users
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.koin.ktor.ext.inject

fun Application.configureDatabase() {
    val database: Database by inject()

    transaction(database) {
        SchemaUtils.create(
            Users,
        )
    }
}
