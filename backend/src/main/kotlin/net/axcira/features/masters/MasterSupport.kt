package net.axcira.features.masters

import io.ktor.http.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.TextColumnType
import org.jetbrains.exposed.v1.exceptions.ExposedSQLException
import org.jetbrains.exposed.v1.jdbc.Query
import java.sql.SQLException
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

const val MASTER_NAME_MAX = 255
const val MASTER_CODE_MAX = 64
const val MASTER_LIST_MAX_LIMIT = 1000

object MasterIds {
    const val TAGS = "tags"
    const val CUSTOMERS = "customers"
    const val PRODUCTS = "products"
}

@Serializable
data class ConflictErrorBody(
    val message: String,
)

@Serializable
data class ReorderMasterInput(
    val sortKey: String,
)

data class MasterListQuery(
    val q: String?,
    val isActive: Boolean?,
    val limit: Int?,
    val offset: Long,
)

sealed interface ParsedQuery {
    data class Ok(
        val value: MasterListQuery,
    ) : ParsedQuery

    data class Invalid(
        val reason: String,
    ) : ParsedQuery
}

sealed interface MasterWriteResult<out T> {
    data class Ok<T>(
        val value: T,
    ) : MasterWriteResult<T>

    data object NotFound : MasterWriteResult<Nothing>

    data object NotModified : MasterWriteResult<Nothing>

    data class Conflict(
        val message: String,
    ) : MasterWriteResult<Nothing>

    data class Invalid(
        val reason: String,
    ) : MasterWriteResult<Nothing>
}

sealed interface MasterDeleteResult {
    data object Ok : MasterDeleteResult

    data object NotFound : MasterDeleteResult

    data class Conflict(
        val message: String,
    ) : MasterDeleteResult
}

fun parseMasterListQuery(parameters: Parameters): ParsedQuery {
    val limitRaw = parameters["limit"]
    val limit =
        if (limitRaw == null) {
            null
        } else {
            val parsed = limitRaw.toIntOrNull()
            if (parsed == null || parsed < 1 || parsed > MASTER_LIST_MAX_LIMIT) {
                return ParsedQuery.Invalid("limit must be between 1 and $MASTER_LIST_MAX_LIMIT")
            }
            parsed
        }
    val offsetRaw = parameters["offset"]
    val offset =
        if (offsetRaw == null) {
            0L
        } else {
            val parsed = offsetRaw.toLongOrNull()
            if (parsed == null || parsed < 0L) return ParsedQuery.Invalid("offset must be 0 or greater")
            parsed
        }
    val isActive =
        when (val raw = parameters["isActive"]) {
            null -> null
            "true" -> true
            "false" -> false
            else -> return ParsedQuery.Invalid("isActive must be true or false")
        }
    val q = parameters["q"]?.trim()?.takeIf { it.isNotEmpty() }
    if (q != null && q.length > MASTER_NAME_MAX) {
        return ParsedQuery.Invalid("q must be at most $MASTER_NAME_MAX characters")
    }
    return ParsedQuery.Ok(MasterListQuery(q, isActive, limit, offset))
}

fun collateC(column: Column<String>): Expression<String> =
    object : Expression<String>() {
        override fun toQueryBuilder(queryBuilder: QueryBuilder) =
            queryBuilder {
                append(column)
                append(" COLLATE \"C\"")
            }
    }

fun sortKeyOrder(column: Column<String>) = collateC(column) to SortOrder.ASC

fun containsIgnoreCase(
    column: Column<String>,
    raw: String,
): Op<Boolean> {
    val escaped =
        raw
            .lowercase()
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_")
    val pattern = "%$escaped%"
    return object : Op<Boolean>() {
        override fun toQueryBuilder(queryBuilder: QueryBuilder) =
            queryBuilder {
                append("LOWER(")
                append(column)
                append(") LIKE ")
                registerArgument(TextColumnType(), pattern)
                append(" ESCAPE '\\'")
            }
    }
}

fun Query.page(query: MasterListQuery): Query {
    var paged = this
    if (query.offset > 0) paged = paged.offset(query.offset)
    if (query.limit != null) paged = paged.limit(query.limit)
    return paged
}

fun Throwable.causedBySqlState(sqlState: String): Boolean {
    var current: Throwable? = this
    while (current != null) {
        if (current is SQLException && current.sqlState == sqlState) return true
        current = current.cause
    }
    return false
}

fun ExposedSQLException.isUniqueViolation() = causedBySqlState("23505")

fun ExposedSQLException.isForeignKeyViolation() = causedBySqlState("23503")

fun OffsetDateTime.toApiString(): String = withOffsetSameInstant(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)

fun nowUtc(): OffsetDateTime = OffsetDateTime.now(ZoneOffset.UTC)

fun sortKeyReasons(sortKey: String): List<String> =
    if (FractionalIndex.isValid(sortKey)) {
        emptyList()
    } else {
        listOf("sortKey must be a fractional index key of at most ${FractionalIndex.MAX_LENGTH} characters")
    }
