package net.axcira.db

import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.dao.id.UIntIdTable
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

/**
 * Coded masters share `code` (unique), `name`, `sort_key` (fractional index, COLLATE "C"),
 * `is_active`, and timestamps. Copy this shape when adding a master.
 */
object Customers : UIntIdTable() {
    val code = varchar("code", length = 64).uniqueIndex()
    val name = varchar("name", length = 255)
    val sortKey = varchar("sort_key", length = 255).uniqueIndex()
    val isActive = bool("is_active").default(true)
    val createdAt = timestampWithTimeZone("created_at").defaultExpression(CurrentTimestampWithTimeZone)
    val updatedAt = timestampWithTimeZone("updated_at").defaultExpression(CurrentTimestampWithTimeZone)
}

object Products : UIntIdTable() {
    val code = varchar("code", length = 64).uniqueIndex()
    val name = varchar("name", length = 255)
    val customerId = reference("customer_id", Customers, onDelete = ReferenceOption.RESTRICT)
    val sortKey = varchar("sort_key", length = 255).uniqueIndex()
    val isActive = bool("is_active").default(true)
    val createdAt = timestampWithTimeZone("created_at").defaultExpression(CurrentTimestampWithTimeZone)
    val updatedAt = timestampWithTimeZone("updated_at").defaultExpression(CurrentTimestampWithTimeZone)
}
