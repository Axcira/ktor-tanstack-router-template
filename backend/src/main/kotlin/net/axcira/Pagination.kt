package net.axcira

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.jdbc.Query


@Serializable
data class Pagination(val limit: Int = 10, val offset: Int = 0)

fun <T> Array<T>.paginate(pagination: Pagination) = slice(pagination.offset until pagination.offset + pagination.limit)
fun Query.paginate(pagination: Pagination) = this.offset(pagination.offset.toLong()).limit(pagination.limit)
