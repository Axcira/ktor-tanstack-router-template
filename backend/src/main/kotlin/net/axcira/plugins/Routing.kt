package net.axcira.plugins

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.initialize
import org.flywaydb.core.Flyway

fun Application.root() {
    routing {
        route("/api") {
            get("/") {
                call.respondText("Hello, World, Reloading!")
            }
            get("/json/kotlinx-serialization") {
                call.respond(mapOf("hello" to "world"))
            }
            if (System.getenv("IS_LEYDEN") == "true") {
                post("/reset") {
                    val flyway = Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").cleanDisabled(false).load()
                    flyway.clean()
                    flyway.migrate()
                    initialize()
                    call.respond(HttpStatusCode.NoContent)
                }
            }
        }
    }
}
