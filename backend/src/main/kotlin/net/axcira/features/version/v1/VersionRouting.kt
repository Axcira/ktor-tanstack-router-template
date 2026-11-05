package net.axcira.features.version.v1

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import net.axcira.apiRouting
import net.axcira.features.version.VersionService

private val versionService = VersionService()

fun Application.version() {
    apiRouting("/version") {
        /**
         * Deployed build identity (backend and bundled frontend when present)
         *
         * OperationID: versionV1
         */
        get {
            call.response.headers.append(HttpHeaders.CacheControl, "no-store")
            call.respond(versionService.get())
        }
    }
}
