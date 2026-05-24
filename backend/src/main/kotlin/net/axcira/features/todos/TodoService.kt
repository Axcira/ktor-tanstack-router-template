package net.axcira.features.todos

import kotlinx.serialization.Serializable
import net.axcira.features.users.Users
import org.jetbrains.exposed.v1.core.dao.id.UIntIdTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.suspendTransaction
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

@Serializable
data class CreateTodoInput(val title: String)

@Serializable
data class UpdateTodoInput(val title: String? = null, val completed: Boolean? = null)

@Serializable
data class TodoDTO(val id: UInt, val title: String, val completed: Boolean)

object Todos : UIntIdTable() {
    val title = varchar("title", 255)
    val completed = bool("completed").default(false)
    val userId = reference("user_id", Users)
}

class TodoService(val database: Database) {
    fun createTodo(userId: UInt, input: CreateTodoInput): TodoDTO {
        return transaction(database) {
            val id = Todos.insert {
                it[title] = input.title
                it[Todos.userId] = userId
            } get Todos.id
            TodoDTO(id.value, input.title, false)
        }
    }

    suspend fun getTodos(userId: UInt): List<TodoDTO> {
        return suspendTransaction(database) {
            Todos.selectAll().where { Todos.userId eq userId }
                .map { TodoDTO(it[Todos.id].value, it[Todos.title], it[Todos.completed]) }
        }
    }

    suspend fun updateTodo(userId: UInt, todoId: UInt, input: UpdateTodoInput) {
        suspendTransaction(database) {
            Todos.update({ (Todos.id eq todoId) and (Todos.userId eq userId) }) {
                if (input.title != null) it[title] = input.title
                if (input.completed != null) it[completed] = input.completed
            }
        }
    }

    suspend fun deleteTodo(userId: UInt, todoId: UInt) {
        suspendTransaction(database) {
            Todos.deleteWhere { (id eq todoId) and (Todos.userId eq userId) }
        }
    }
}
