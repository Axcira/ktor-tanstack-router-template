package net.axcira.features.permissions

import kotlinx.serialization.Serializable

@Serializable
sealed interface Permission {
    fun satisfies(required: Permission): Boolean = this::class == required::class

    @Serializable
    data object ManageUsers : Permission

    @Serializable
    data object CreateArticle : Permission

    @Serializable
    data class UpdateArticle(val allowOthers: Boolean) : Permission {
        override fun satisfies(required: Permission): Boolean {
            if (required !is UpdateArticle) return false

            if (required.allowOthers && !this.allowOthers) return false
            return true
        }
    }

    @Serializable
    data class DeleteArticle(val allowOthers: Boolean) : Permission {
        override fun satisfies(required: Permission): Boolean {
            if (required !is UpdateArticle) return false

            if (required.allowOthers && !this.allowOthers) return false
            return true
        }
    }
}
