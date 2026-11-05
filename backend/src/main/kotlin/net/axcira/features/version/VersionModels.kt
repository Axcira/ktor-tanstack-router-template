package net.axcira.features.version

import kotlinx.serialization.Serializable

@Serializable
data class VersionIdentity(
    val commit: String,
    val commitShort: String,
    val builtAt: String,
    val dirty: Boolean,
)

@Serializable
data class VersionResponse(
    val commit: String,
    val commitShort: String,
    val builtAt: String,
    val dirty: Boolean,
    val frontend: VersionIdentity? = null,
)
