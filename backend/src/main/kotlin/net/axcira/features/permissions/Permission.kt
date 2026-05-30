package net.axcira.features.permissions

import kotlinx.serialization.Serializable

@Serializable
sealed interface Permission {
    fun satisfies(required: Permission): Boolean {
        return this is Administrator || check(required)
    }

    fun check(required: Permission): Boolean = this == required

    /**
     * Administrator can bypass any permission checks - be careful!
     */
    @Serializable
    data object Administrator : Permission

    @Serializable
    data object ManageUsers : Permission

    /**
     * ManageArticles permission is a combination of all permissions that can be used to manage articles.
     */
    @Serializable
    data object ManageArticles : Permission {
        override fun check(required: Permission): Boolean {
            return when (required) {
                is CreateArticle, is UpdateArticle, is DeleteArticle, is ManageArticles -> true
                else -> false
            }
        }
    }

    @Serializable
    data object CreateArticle : Permission

    @Serializable
    data class UpdateArticle(val allowOthers: Boolean) : Permission {
        override fun check(required: Permission): Boolean {
            if (required !is UpdateArticle) return false
            if (required.allowOthers && !this.allowOthers) return false
            return true
        }
    }

    @Serializable
    data class DeleteArticle(val allowOthers: Boolean) : Permission {
        override fun check(required: Permission): Boolean {
            if (required !is DeleteArticle) return false
            if (required.allowOthers && !this.allowOthers) return false
            return true
        }
    }
}

