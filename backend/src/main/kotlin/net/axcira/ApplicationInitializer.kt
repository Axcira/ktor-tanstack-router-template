package net.axcira

import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import kotlinx.coroutines.launch
import net.axcira.features.permissions.*
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserService

fun Application.subscribe() {
    monitor.subscribe(ApplicationStarted) {
        launch {
            initialize()
        }
    }
}

suspend fun Application.initialize() {
    if (System.getenv("SKIP_BOOTSTRAP") == "true") {
        log.info("SKIP_BOOTSTRAP is set. Skipping admin user/role initialization.")
        return
    }

    val userService: UserService by dependencies
    val permissionService: PermissionService by dependencies

    val adminRoleName = System.getenv("ADMIN_ROLE_NAME") ?: "Administrator"
    val adminEmail = System.getenv("ADMIN_EMAIL") ?: "admin@example.com"
    val adminPassword by lazy {
        System.getenv("ADMIN_PASSWORD") ?: run {
            if (isDevelopment) {
                log.warn("No ADMIN_PASSWORD environment variable set. Using 'password' as default in development mode.")
                "password"
            } else {
                throw IllegalStateException("No ADMIN_PASSWORD environment variable set.")
            }
        }
    }

    val adminRoleId = when (val role = permissionService.getRoleByName(adminRoleName)) {
        null -> {
            log.info("Initializing roles...")
            permissionService.create(
                CreateRoleInput(
                    adminRoleName, "All privileges granted.", listOf(Permission.Administrator)
                )
            ).id
        }

        else -> {
            log.info("Admin role already exists. Skipping...")
            role.id
        }
    }

    if (userService.findByEmail(adminEmail) != null) {
        log.info("Admin user already exists. Skipping...")
    } else {
        log.info("Creating admin user...")
        userService.createUser(CreateUserInput(adminEmail, adminPassword, adminRoleId))
        log.info("Admin user created. You can safely remove password from environment variables.")
    }
    log.info("Initialize complete!")
}
