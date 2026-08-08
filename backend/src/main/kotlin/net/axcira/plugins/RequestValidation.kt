package net.axcira.plugins

import io.ktor.server.application.*
import io.ktor.server.plugins.requestvalidation.*
import net.axcira.features.articles.CreateArticleInput
import net.axcira.features.articles.UpdateArticleInput
import net.axcira.features.auth.LoginRequest
import net.axcira.features.permissions.CreateRoleInput
import net.axcira.features.permissions.UpdateRoleInput
import net.axcira.features.users.CreateUserInput
import net.axcira.features.users.UpdateUserInput

private val emailPattern = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")

private const val EMAIL_MAX = 50
private const val PASSWORD_MIN = 8
private const val TITLE_MAX = 255
private const val DESCRIPTION_MAX = 255
private const val TAG_MAX = 255
private const val ROLE_NAME_MAX = 255

fun Application.configureRequestValidation() {
    install(RequestValidation) {
        validate<LoginRequest> { request ->
            validationResult(
                buildList {
                    addAll(emailReasons(request.email))
                    addAll(passwordReasons(request.password))
                },
            )
        }

        validate<CreateUserInput> { input ->
            validationResult(
                buildList {
                    addAll(emailReasons(input.email))
                    addAll(passwordReasons(input.password))
                    if (input.roleId == 0u) add("roleId must be greater than 0")
                },
            )
        }

        validate<UpdateUserInput> { input ->
            validationResult(
                buildList {
                    when (val email = input.email) {
                        is Optional.Present -> addAll(emailReasons(email.value))
                        is Optional.None -> Unit
                    }
                    when (val password = input.password) {
                        is Optional.Present -> addAll(passwordReasons(password.value))
                        is Optional.None -> Unit
                    }
                    when (val roleId = input.roleId) {
                        is Optional.Present -> if (roleId.value == 0u) add("roleId must be greater than 0")
                        is Optional.None -> Unit
                    }
                },
            )
        }

        validate<CreateArticleInput> { input ->
            validationResult(
                buildList {
                    addAll(requiredMax("title", input.title, TITLE_MAX))
                    addAll(requiredMax("description", input.description, DESCRIPTION_MAX))
                    // body is Exposed text — empty content is allowed (existing tests use "")
                    addAll(tagListReasons(input.tagList))
                },
            )
        }

        validate<UpdateArticleInput> { input ->
            validationResult(
                buildList {
                    when (val title = input.title) {
                        is Optional.Present -> addAll(requiredMax("title", title.value, TITLE_MAX))
                        is Optional.None -> Unit
                    }
                    when (val description = input.description) {
                        is Optional.Present -> addAll(requiredMax("description", description.value, DESCRIPTION_MAX))
                        is Optional.None -> Unit
                    }
                    when (val tags = input.tagList) {
                        is Optional.Present -> addAll(tagListReasons(tags.value))
                        is Optional.None -> Unit
                    }
                },
            )
        }

        validate<CreateRoleInput> { input ->
            validationResult(
                buildList {
                    addAll(requiredMax("name", input.name, ROLE_NAME_MAX))
                },
            )
        }

        validate<UpdateRoleInput> { input ->
            validationResult(
                buildList {
                    when (val name = input.name) {
                        is Optional.Present -> addAll(requiredMax("name", name.value, ROLE_NAME_MAX))
                        is Optional.None -> Unit
                    }
                },
            )
        }
    }
}

private fun validationResult(reasons: List<String>): ValidationResult =
    if (reasons.isEmpty()) ValidationResult.Valid else ValidationResult.Invalid(reasons)

private fun emailReasons(email: String): List<String> =
    buildList {
        if (email.isBlank()) {
            add("email must not be blank")
        } else {
            if (email.length > EMAIL_MAX) add("email must be at most $EMAIL_MAX characters")
            if (!emailPattern.matches(email)) add("email must be a valid email address")
        }
    }

private fun passwordReasons(password: String): List<String> =
    buildList {
        if (password.isBlank()) {
            add("password must not be blank")
        } else if (password.length < PASSWORD_MIN) {
            add("password must be at least $PASSWORD_MIN characters")
        }
    }

private fun requiredMax(
    field: String,
    value: String,
    max: Int,
): List<String> =
    buildList {
        if (value.isBlank()) {
            add("$field must not be blank")
        } else if (value.length > max) {
            add("$field must be at most $max characters")
        }
    }

private fun tagListReasons(tags: List<String>): List<String> =
    buildList {
        tags.forEachIndexed { index, tag ->
            if (tag.isBlank()) {
                add("tagList[$index] must not be blank")
            } else if (tag.length > TAG_MAX) {
                add("tagList[$index] must be at most $TAG_MAX characters")
            }
        }
    }
