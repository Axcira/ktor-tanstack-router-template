package net.axcira.features.todos

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import net.axcira.apiRouting
import net.axcira.plugins.UserSession

fun Application.todos() {
    val todoService: TodoService by dependencies

    apiRouting {
        authenticate {
            /**
             * Get all todos
             *
             * OperationID: getAllTodos
             */
            get("/todos") {
                val userId = call.sessions.get<UserSession>()?.userId ?: throw IllegalArgumentException("User not authenticated")
                val todos = todoService.getTodos(userId)
                call.respond(todos)
            }

            /**
             * Create a new todo
             *
             * OperationID: createTodo
             */
            post("/todos") {
                val userId = call.sessions.get<UserSession>()?.userId ?: throw IllegalArgumentException("User not authenticated")
                val input = call.receive<CreateTodoInput>()
                val todo = todoService.createTodo(userId, input)
                call.respond(HttpStatusCode.Created, todo)
            }

            /**
             * Update a todo
             *
             * OperationID: updateTodo
             */
            patch("/todos/{id}") {
                val userId = call.sessions.get<UserSession>()?.userId ?: throw IllegalArgumentException("User not authenticated")
                val todoId = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("Invalid ID")
                val input = call.receive<UpdateTodoInput>()
                todoService.updateTodo(userId, todoId, input)
                call.respond(HttpStatusCode.NoContent)
            }

            /**
             * Delete a todo
             *
             * OperationID: deleteTodo
             */
            delete("/todos/{id}") {
                val userId = call.sessions.get<UserSession>()?.userId ?: throw IllegalArgumentException("User not authenticated")
                val todoId = call.parameters["id"]?.toUIntOrNull() ?: throw IllegalArgumentException("Invalid ID")
                todoService.deleteTodo(userId, todoId)
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
