package net.axcira

import io.ktor.server.application.*
import io.ktor.server.routing.*
import net.axcira.features.auth.auth
import net.axcira.features.users.users
import net.axcira.plugins.*

fun Application.main() {
    module()
    configureSerialization()
    configureAuthentication()
    configureOpenApi()
    configureDatabase()

    install(IgnoreTrailingSlash)
    routing {
        route("/api") {
            root()
            auth()
            users()
        }
    }
}
