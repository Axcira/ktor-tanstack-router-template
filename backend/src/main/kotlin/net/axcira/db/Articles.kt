package net.axcira.db

import org.jetbrains.exposed.v1.core.ReferenceOption
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.dao.id.UIntIdTable
import org.jetbrains.exposed.v1.javatime.CurrentTimestampWithTimeZone
import org.jetbrains.exposed.v1.javatime.timestampWithTimeZone

object Articles : UIntIdTable() {
    val title = varchar("title", length = 255)
    val description = varchar("description", length = 255)
    val body = text("body")
    val userId = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
}

/**
 * Tag master. `name` is the natural key (article forms still upsert by name).
 * `sort_key` is a fractional-index key compared with COLLATE "C" (see V15).
 */
object Tags : UIntIdTable() {
    val name = varchar("name", length = 255).uniqueIndex()
    val sortKey = varchar("sort_key", length = 255).uniqueIndex()
    val isActive = bool("is_active").default(true)
    val createdAt = timestampWithTimeZone("created_at").defaultExpression(CurrentTimestampWithTimeZone)
    val updatedAt = timestampWithTimeZone("updated_at").defaultExpression(CurrentTimestampWithTimeZone)
}

object ArticleTags : Table() {
    val articleId = reference("article_id", Articles, onDelete = ReferenceOption.CASCADE)
    val tagId = reference("tag_id", Tags, onDelete = ReferenceOption.RESTRICT)

    override val primaryKey = PrimaryKey(articleId, tagId)
}
