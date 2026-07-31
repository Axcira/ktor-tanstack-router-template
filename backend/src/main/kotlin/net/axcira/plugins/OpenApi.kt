package net.axcira.plugins

import io.ktor.http.*
import io.ktor.openapi.*
import io.ktor.server.application.*
import io.ktor.server.html.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.routing.openapi.*
import io.ktor.utils.io.*
import kotlinx.html.*

@OptIn(ExperimentalKtorApi::class)
fun Application.configureOpenApi() {
    val serveFrontend = shouldServeFrontend()
    val exposeOpenApi = !serveFrontend || System.getenv("EXPOSE_OPENAPI") == "true"

    routing {
        if (exposeOpenApi) {
            get("/openapi.json") {
                val doc = OpenApiDoc(info = OpenApiInfo("My API", "1.0")) + call.application.routingRoot.descendants()
                call.respond(doc)
            }.hide()
        }

        // Production images ship a static SPA at `/`; keep Scalar only for API-only / local runs.
        if (!serveFrontend) {
            get("/") {
                call.respondHtml(HttpStatusCode.OK) {
                    head {
                        title { +"API Reference" }
                        meta { charset = "utf-8" }
                        meta {
                            name = "viewport"
                            content = "width=device-width, initial-scale=1"
                        }
                    }
                    body {
                        unsafe {
                            +
                                """
                                <script id="api-reference" data-url="/openapi.json"></script>
                                <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
                                """.trimIndent()
                        }
                    }
                }
            }.hide()
        }
    }
}
