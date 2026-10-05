package net.axcira

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.db.Role
import net.axcira.features.auth.LoginRequest
import net.axcira.features.permissions.Permission
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UserDTO
import net.axcira.features.users.UserService
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import kotlin.test.assertEquals

suspend fun SharedTestContext.login(
    client: HttpClient,
    email: String,
    permissions: List<Permission> = listOf(Permission.Administrator),
): UserDTO {
    val database: Database by application.dependencies
    val userService = UserService(database)
    val roleId =
        database.dbQuery {
            Role.insertAndGetId {
                it[name] = email
                it[description] = email
                it[Role.permissions] = permissions
            }
        }
    val user = userService.createUser(CreateUserInput(email, "password", roleId.value))
    val response =
        client.post("/api/v1/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest(email, "password"))
        }
    assertEquals(HttpStatusCode.OK, response.status)
    return user
}
