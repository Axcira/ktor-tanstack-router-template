package net.axcira.features.permissions

import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import kotlinx.coroutines.launch
import net.axcira.features.users.UserService
import org.jetbrains.exposed.v1.jdbc.Database

fun Application.subscribe() {
    monitor.subscribe(ApplicationStarted) {
        launch {
            initializePermissions()
        }
    }
}

suspend fun Application.initializePermissions() {
    val database: Database by dependencies
    val userService: UserService by dependencies
    val permissionService: PermissionService by dependencies

    log.info("Initializing users...")
    if (permissionService.getAllRoles().isNotEmpty()) {
        log.info("Roles already initialized. Skipping...")
    } else {
        log.info("Initializing roles...")
        permissionService.create(
            CreateRoleInput(
                "Administrator", "All privileges granted.", listOf(Permission.Administrator)
            )
        )
        permissionService.create(
            CreateRoleInput(
                "User", "Default role.", emptyList()
            )
        )
    }
}
