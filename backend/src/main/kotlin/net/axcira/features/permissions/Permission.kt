package net.axcira.features.permissions

import kotlinx.serialization.Serializable

@Serializable
sealed interface Permission {
    @Serializable
    data object ManageUsers : Permission

    @Serializable
    data object CreateArticle : Permission

    @Serializable
    data class UpdateArticle(val allowOthers: Boolean) : Permission

    @Serializable
    data class DeleteArticle(val allowOthers: Boolean) : Permission
}
