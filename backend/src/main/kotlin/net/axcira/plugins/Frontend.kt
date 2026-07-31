package net.axcira.plugins

import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.routing.*
import java.io.File

/**
 * Resolves the directory that contains the production SPA (`index.html`).
 *
 * Order: `STATIC_DIR` env → `/app/static` (container) → `./static` (cwd).
 * Returns null when no built frontend is present (local API/Scalar mode).
 */
fun resolveStaticDir(): File? {
    val candidates =
        buildList {
            System.getenv("STATIC_DIR")?.takeIf { it.isNotBlank() }?.let { add(File(it)) }
            add(File("/app/static"))
            add(File("static"))
        }
    return candidates.firstOrNull { File(it, "index.html").isFile }
}

fun shouldServeFrontend(): Boolean = System.getenv("SERVE_FRONTEND") == "true" || resolveStaticDir() != null

/**
 * Serves the Vite/TanStack SPA from disk when a build is present.
 * Local development keeps Vite on :3000 and leaves `/` to Scalar (see [configureOpenApi]).
 */
fun Application.configureFrontend() {
    val staticDir = resolveStaticDir()
    if (staticDir == null) {
        if (System.getenv("SERVE_FRONTEND") == "true") {
            log.warn("SERVE_FRONTEND=true but no index.html found under STATIC_DIR / /app/static / ./static")
        }
        return
    }

    log.info("Serving frontend SPA from ${staticDir.absolutePath}")
    routing {
        singlePageApplication {
            filesPath = staticDir.absolutePath
            defaultPage = "index.html"
        }
    }
}
