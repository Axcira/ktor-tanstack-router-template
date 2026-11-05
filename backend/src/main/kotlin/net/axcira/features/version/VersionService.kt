package net.axcira.features.version

import kotlinx.serialization.json.Json
import net.axcira.plugins.resolveStaticDir
import java.io.File
import java.util.Properties

class VersionService {
    private val json = Json { ignoreUnknownKeys = true }

    private val backendIdentity: VersionIdentity by lazy { loadBackendIdentity() }

    fun get(): VersionResponse {
        val frontend = loadFrontendIdentity()
        return VersionResponse(
            commit = backendIdentity.commit,
            commitShort = backendIdentity.commitShort,
            builtAt = backendIdentity.builtAt,
            dirty = backendIdentity.dirty,
            frontend = frontend,
        )
    }

    private fun loadBackendIdentity(): VersionIdentity {
        val props = Properties()
        VersionService::class.java.getResourceAsStream("/build-info.properties")?.use {
            props.load(it)
        }
        return VersionIdentity(
            commit = props.getProperty("commit", "unknown"),
            commitShort = props.getProperty("commitShort", "unknown"),
            builtAt = props.getProperty("builtAt", "unknown"),
            dirty = props.getProperty("dirty", "false").toBooleanStrictOrNull() ?: false,
        )
    }

    private fun loadFrontendIdentity(): VersionIdentity? {
        val staticDir = resolveStaticDir() ?: return null
        val file = File(staticDir, "version.json")
        if (!file.isFile) return null
        return runCatching {
            json.decodeFromString<VersionIdentity>(file.readText())
        }.getOrNull()
    }
}
