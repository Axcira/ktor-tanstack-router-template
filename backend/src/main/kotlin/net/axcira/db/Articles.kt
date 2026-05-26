package net.axcira.db

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.dao.id.UIntIdTable

object Articles : UIntIdTable() {
    val title = varchar("title", length = 255)
    val description = varchar("description", length = 255)
    val body = text("body")
    val userId = reference("user_id", Users)
}

object Tags : UIntIdTable() {
    val name = varchar("name", length = 255)
}

object ArticleTags : Table() {
    val articleId = reference("article_id", Articles)
    val tagId = reference("tag_id", Tags)

    override val primaryKey = PrimaryKey(articleId, tagId)
}
