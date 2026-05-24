package net.axcira

import io.ktor.server.testing.*
import io.ktor.utils.io.*
import org.jetbrains.exposed.v1.jdbc.Database

@OptIn(InternalAPI::class)
fun test(block: suspend ApplicationTestBuilder.() -> Unit) = testApplication {
    configure("application.yaml", "test.application.yaml")
    block()
}

fun database() = Database.connect("jdbc:h2:mem:regular;DB_CLOSE_DELAY=-1")
