package net.axcira.plugins

import io.ktor.server.application.*
import io.ktor.server.plugins.di.*
import net.axcira.features.auth.AuthService
import net.axcira.features.todos.TodoService
import net.axcira.features.users.UserService

fun Application.module() {
    dependencies {
        provide<AuthService>(::AuthService)
        provide<UserService>(::UserService)
        provide<TodoService>(::TodoService)
    }
}
