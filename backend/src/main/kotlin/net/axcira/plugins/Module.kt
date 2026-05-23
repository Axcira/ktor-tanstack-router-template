package net.axcira.plugins

import io.ktor.server.application.*
import net.axcira.dbModule
import net.axcira.features.auth.authModule
import net.axcira.features.users.userModule
import org.koin.ktor.plugin.Koin

fun Application.module() {
    install(Koin) {
        modules(
            dbModule,
            userModule,
            authModule,
        )
    }
}
