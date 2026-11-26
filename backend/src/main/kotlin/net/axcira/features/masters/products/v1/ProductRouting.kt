package net.axcira.features.masters.products.v1

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
import net.axcira.features.masters.products.CreateProductInput
import net.axcira.features.masters.products.ProductService
import net.axcira.features.masters.products.UpdateProductInput
import net.axcira.features.permissions.requireMaster
import net.axcira.plugins.ValidationErrorBody

fun Application.products() {
    val productService: ProductService by dependencies

    apiRouting("/products") {
        authenticate {
            requireMaster(MasterIds.PRODUCTS) {
                /**
                 * List products
                 *
                 * OperationID: listProductsV1
                 */
                get {
                    when (val parsed = parseMasterListQuery(call.request.queryParameters)) {
                        is ParsedQuery.Invalid -> {
                            call.respond(HttpStatusCode.BadRequest, ValidationErrorBody(reasons = listOf(parsed.reason)))
                        }

                        is ParsedQuery.Ok -> {
                            call.respond(productService.list(parsed.value))
                        }
                    }
                }

                /**
                 * Get a product
                 *
                 * OperationID: getProductV1
                 */
                get("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@get call.respond(HttpStatusCode.BadRequest)
                    val product = productService.get(id) ?: return@get call.respond(HttpStatusCode.NotFound)
                    call.respond(product)
                }

                /**
                 * Create a product
                 *
                 * OperationID: createProductV1
                 */
                post {
                    val input = call.receive<CreateProductInput>()
                    when (val result = productService.create(input)) {
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
                 * Update a product
                 *
                 * OperationID: updateProductV1
                 */
                patch("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@patch call.respond(HttpStatusCode.BadRequest)
                    val input = call.receive<UpdateProductInput>()
                    when (val result = productService.update(id, input)) {
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
                 * Delete a product
                 *
                 * OperationID: deleteProductV1
                 */
                delete("/{id}") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@delete call.respond(HttpStatusCode.BadRequest)
                    when (val result = productService.delete(id)) {
                        MasterDeleteResult.Ok -> call.respond(HttpStatusCode.NoContent)
                        MasterDeleteResult.NotFound -> call.respond(HttpStatusCode.NotFound)
                        is MasterDeleteResult.Conflict -> call.respond(HttpStatusCode.Conflict, ConflictErrorBody(result.message))
                    }
                }

                /**
                 * Store a client-generated fractional sort key.
                 *
                 * OperationID: reorderProductV1
                 */
                patch("/{id}/sort") {
                    val id = call.parameters["id"]?.toUIntOrNull() ?: return@patch call.respond(HttpStatusCode.BadRequest)
                    val input = call.receive<ReorderMasterInput>()
                    when (val result = productService.reorder(id, input.sortKey)) {
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
