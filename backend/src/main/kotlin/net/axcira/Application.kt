package net.axcira

import io.ktor.server.application.*
import io.ktor.server.routing.*
import net.axcira.features.auth.auth
import net.axcira.features.users.users
import net.axcira.plugins.*

import org.koin.core.module.Module
import org.koin.ktor.plugin.Koin

fun Application.main(koinModules: List<Module>? = null) {
    if (koinModules != null) {
        install(Koin) {
            modules(koinModules)
        }
    } else {
        module()
    }
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
