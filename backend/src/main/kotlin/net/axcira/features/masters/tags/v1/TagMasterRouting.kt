package net.axcira.features.masters.tags.v1

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.plugins.di.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.apiRouting
import net.axcira.features.masters.ConflictErrorBody
import net.axcira.features.masters.MasterDeleteResult
import net.axcira.features.masters.MasterIds
import net.axcira.features.masters.MasterWriteResult
import net.axcira.features.masters.ParsedQuery
import net.axcira.features.masters.ReorderMasterInput
import net.axcira.features.masters.parseMasterListQuery
import net.axcira.features.masters.tags.CreateTagMasterInput
import net.axcira.features.masters.tags.TagMasterService
import net.axcira.features.masters.tags.UpdateTagMasterInput
import net.axcira.features.permissions.requireMaster
import net.axcira.plugins.ValidationErrorBody

fun Application.tagMasters() {
    val tagMasterService: TagMasterService by dependencies

    apiRouting("/tags") {
        authenticate {
            requireMaster(MasterIds.TAGS) {
                /**
                 * List tag masters
                 *
                 * OperationID: listTagsV1
                 */
                get {
                    when (val parsed = parseMasterListQuery(call.request.queryParameters)) {
                        is ParsedQuery.Invalid -> {
                            call.respond(HttpStatusCode.BadRequest, ValidationErrorBody(reasons = listOf(parsed.reason)))
                        }

                        is ParsedQuery.Ok -> {
                            call.respond(tagMasterService.list(parsed.value))
                        }
                    }
                }

                /**
                 * Get a tag master
                 *
                 * OperationID: getTagV1
                 */
                get("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                    val tag = tagMasterService.get(id) ?: return@get call.respond(HttpStatusCode.NotFound)
                    call.respond(tag)
                }

                /**
                 * Create a tag master
                 *
                 * OperationID: createTagV1
                 */
                post {
                    val input = call.receive<CreateTagMasterInput>()
                    when (val result = tagMasterService.create(input)) {
                        is MasterWriteResult.Ok -> {
                            call.respond(HttpStatusCode.Created, result.value)
                        }

                        is MasterWriteResult.Conflict -> {
                            call.respond(HttpStatusCode.Conflict, ConflictErrorBody(result.message))
                        }

                        is MasterWriteResult.Invalid -> {
                            call.respond(HttpStatusCode.BadRequest, ValidationErrorBody(reasons = listOf(result.reason)))
                        }

                        MasterWriteResult.NotFound -> {
                            call.respond(HttpStatusCode.NotFound)
                        }

                        MasterWriteResult.NotModified -> {
                            call.respond(HttpStatusCode.NoContent)
                        }
                    }
                }

                /**
                 * Update a tag master
                 *
                 * OperationID: updateTagV1
                 */
                patch("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@patch call.respond(HttpStatusCode.BadRequest)
                    val input = call.receive<UpdateTagMasterInput>()
                    when (val result = tagMasterService.update(id, input)) {
                        is MasterWriteResult.Ok -> {
                            call.respond(result.value)
                        }

                        is MasterWriteResult.Conflict -> {
                            call.respond(HttpStatusCode.Conflict, ConflictErrorBody(result.message))
                        }

                        is MasterWriteResult.Invalid -> {
                            call.respond(HttpStatusCode.BadRequest, ValidationErrorBody(reasons = listOf(result.reason)))
                        }

                        MasterWriteResult.NotFound -> {
                            call.respond(HttpStatusCode.NotFound)
                        }

                        MasterWriteResult.NotModified -> {
                            call.respond(HttpStatusCode.NoContent)
                        }
                    }
                }

                /**
                 * Delete a tag master. Referenced tags return 409.
                 *
                 * OperationID: deleteTagV1
                 */
                delete("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@delete call.respond(HttpStatusCode.BadRequest)
                    when (val result = tagMasterService.delete(id)) {
                        MasterDeleteResult.Ok -> call.respond(HttpStatusCode.NoContent)
                        MasterDeleteResult.NotFound -> call.respond(HttpStatusCode.NotFound)
                        is MasterDeleteResult.Conflict -> call.respond(HttpStatusCode.Conflict, ConflictErrorBody(result.message))
                    }
                }

                /**
                 * Store a client-generated fractional sort key.
                 *
                 * OperationID: reorderTagV1
                 */
                patch("/{id}/sort") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@patch call.respond(HttpStatusCode.BadRequest)
                    val input = call.receive<ReorderMasterInput>()
                    when (val result = tagMasterService.reorder(id, input.sortKey)) {
                        is MasterWriteResult.Ok -> {
                            call.respond(result.value)
                        }

                        is MasterWriteResult.Conflict -> {
                            call.respond(HttpStatusCode.Conflict, ConflictErrorBody(result.message))
                        }

                        is MasterWriteResult.Invalid -> {
                            call.respond(HttpStatusCode.BadRequest, ValidationErrorBody(reasons = listOf(result.reason)))
                        }

                        MasterWriteResult.NotFound -> {
                            call.respond(HttpStatusCode.NotFound)
                        }

                        MasterWriteResult.NotModified -> {
                            call.respond(HttpStatusCode.NoContent)
                        }
                    }
                }
            }
        }
    }
}
