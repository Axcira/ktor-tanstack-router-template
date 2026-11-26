package net.axcira.features.masters.customers.v1

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
import net.axcira.features.masters.customers.CreateCustomerInput
import net.axcira.features.masters.customers.CustomerService
import net.axcira.features.masters.customers.UpdateCustomerInput
import net.axcira.features.masters.parseMasterListQuery
import net.axcira.features.permissions.requireAnyMaster
import net.axcira.features.permissions.requireMaster
import net.axcira.plugins.ValidationErrorBody

fun Application.customers() {
    val customerService: CustomerService by dependencies

    apiRouting("/customers") {
        authenticate {
            requireAnyMaster(listOf(MasterIds.CUSTOMERS, MasterIds.PRODUCTS)) {
                /**
                 * Customer labels for product editors
                 *
                 * OperationID: listCustomerOptionsV1
                 */
                get("/options") {
                    call.respond(customerService.options())
                }
            }
            requireMaster(MasterIds.CUSTOMERS) {
                /**
                 * List customers
                 *
                 * OperationID: listCustomersV1
                 */
                get {
                    when (val parsed = parseMasterListQuery(call.request.queryParameters)) {
                        is ParsedQuery.Invalid -> {
                            call.respond(HttpStatusCode.BadRequest, ValidationErrorBody(reasons = listOf(parsed.reason)))
                        }

                        is ParsedQuery.Ok -> {
                            call.respond(customerService.list(parsed.value))
                        }
                    }
                }

                /**
                 * Get a customer
                 *
                 * OperationID: getCustomerV1
                 */
                get("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                    val customer = customerService.get(id) ?: return@get call.respond(HttpStatusCode.NotFound)
                    call.respond(customer)
                }

                /**
                 * Create a customer
                 *
                 * OperationID: createCustomerV1
                 */
                post {
                    val input = call.receive<CreateCustomerInput>()
                    when (val result = customerService.create(input)) {
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
                 * Update a customer
                 *
                 * OperationID: updateCustomerV1
                 */
                patch("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@patch call.respond(HttpStatusCode.BadRequest)
                    val input = call.receive<UpdateCustomerInput>()
                    when (val result = customerService.update(id, input)) {
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
                 * Delete a customer. Customers referenced by products return 409.
                 *
                 * OperationID: deleteCustomerV1
                 */
                delete("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@delete call.respond(HttpStatusCode.BadRequest)
                    when (val result = customerService.delete(id)) {
                        MasterDeleteResult.Ok -> call.respond(HttpStatusCode.NoContent)
                        MasterDeleteResult.NotFound -> call.respond(HttpStatusCode.NotFound)
                        is MasterDeleteResult.Conflict -> call.respond(HttpStatusCode.Conflict, ConflictErrorBody(result.message))
                    }
                }

                /**
                 * Store a client-generated fractional sort key.
                 *
                 * OperationID: reorderCustomerV1
                 */
                patch("/{id}/sort") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@patch call.respond(HttpStatusCode.BadRequest)
                    val input = call.receive<ReorderMasterInput>()
                    when (val result = customerService.reorder(id, input.sortKey)) {
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
