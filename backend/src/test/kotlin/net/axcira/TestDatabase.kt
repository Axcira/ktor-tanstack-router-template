package net.axcira

import net.axcira.features.users.Users
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.koin.dsl.module

val testDbModule = module {
    single<Database> {
        val db = Database.connect("jdbc:h2:mem:test;DB_CLOSE_DELAY=-1;", driver = "org.h2.Driver")
        transaction(db) {
            SchemaUtils.create(Users)
        }
        db
    }
}

