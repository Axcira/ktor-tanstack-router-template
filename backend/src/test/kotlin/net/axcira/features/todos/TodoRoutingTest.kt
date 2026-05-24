package net.axcira.features.todos

import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import net.axcira.features.users.CreateUserInput
import net.axcira.test
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class TodoRoutingTest {
    @Test
    fun `test todo crud`() = test {
        val client = createClient {
            install(ContentNegotiation) {
                json()
            }
        }

        // 1. Create user to get session
        val userResponse = client.post("/api/users") {
            contentType(ContentType.Application.Json)
            setBody(CreateUserInput("todo-test@example.com", "password"))
        }
        assertEquals(HttpStatusCode.Created, userResponse.status)
        val sessionCookie = userResponse.headers["Set-Cookie"]

        // 2. Create todo
        val createResponse = client.post("/api/todos") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Cookie, sessionCookie)
            setBody(CreateTodoInput("Test Todo"))
        }
        assertEquals(HttpStatusCode.Created, createResponse.status)
        val createdTodo = createResponse.body<TodoDTO>()
        assertEquals("Test Todo", createdTodo.title)
        assertEquals(false, createdTodo.completed)

        // 3. Get todos
        val getResponse = client.get("/api/todos") {
            header(HttpHeaders.Cookie, sessionCookie)
        }
        assertEquals(HttpStatusCode.OK, getResponse.status)
        val todos = getResponse.body<List<TodoDTO>>()
        assert(todos.any { it.id == createdTodo.id })

        // 4. Update todo
        val updateResponse = client.patch("/api/todos/${createdTodo.id}") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Cookie, sessionCookie)
            setBody(UpdateTodoInput(completed = true))
        }
        assertEquals(HttpStatusCode.NoContent, updateResponse.status)

        // 5. Verify update
        val getResponse2 = client.get("/api/todos") {
            header(HttpHeaders.Cookie, sessionCookie)
        }
        val updatedTodo = getResponse2.body<List<TodoDTO>>().first { it.id == createdTodo.id }
        assertEquals(true, updatedTodo.completed)

        // 6. Delete todo
        val deleteResponse = client.delete("/api/todos/${createdTodo.id}") {
            header(HttpHeaders.Cookie, sessionCookie)
        }
        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)

        // 7. Verify delete
        val getResponse3 = client.get("/api/todos") {
            header(HttpHeaders.Cookie, sessionCookie)
        }
        val todosAfterDelete = getResponse3.body<List<TodoDTO>>()
        assert(todosAfterDelete.none { it.id == createdTodo.id })
    }
}
