package net.axcira

sealed interface UpdateResult<out T> {
    data class Success<T>(
        val value: T,
    ) : UpdateResult<T>

    object NotFound : UpdateResult<Nothing>

    object NotModified : UpdateResult<Nothing>
}
