package net.axcira

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.jdbc.Query

@Serializable
data class Pagination(
    val limit: Int = 10,
    val offset: Int = 0,
)

/**
 * Returns a slice of this array for [pagination].
 *
 * [Pagination.offset] is the start index and [Pagination.limit] is the number of elements.
 *
 * @return A new array containing the requested slice.
 */
fun <T> Array<T>.paginate(pagination: Pagination) = slice(pagination.offset until pagination.offset + pagination.limit)

/**
 * Applies [pagination] to this query.
 *
 * [Pagination.offset] is the start index and [Pagination.limit] is the maximum row count.
 *
 * @return This query with offset and limit applied.
 */
fun Query.paginate(pagination: Pagination) = this.offset(pagination.offset.toLong()).limit(pagination.limit)
