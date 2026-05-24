package net.axcira

import io.ktor.server.testing.*
import net.axcira.features.auth.authModule
import net.axcira.features.users.userModule

fun TestApplicationBuilder.testConfig() {
    application {
        main(listOf(testDbModule, userModule, authModule))
    }
}
