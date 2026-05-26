package net.axcira.features.articles

import kotlinx.html.Entities
import kotlinx.serialization.Serializable
import net.axcira.db.ArticleTags
import net.axcira.db.Articles
import net.axcira.db.Tags
import net.axcira.features.users.UpdateUserInput
import net.axcira.plugins.database
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.*
import kotlin.collections.flatten

@Serializable
data class CreateArticleInput(val title: String, val description: String, val body: String, val tagList: List<String>)

@Serializable
data class UpdateArticleInput(
    val title: String?, val description: String?, val body: String?, val tagList: List<String>?
)

@Serializable
data class ArticleDTO(
    val id: UInt,
    val userId: UInt,
    val title: String,
    val description: String,
    val body: String,
    val tagList: List<String>
)

private fun Database.upsertTags(tags: List<String>) = run {
    val existingTags = Tags.selectAll().where { Tags.name inList tags }.toList()
    val newTags = tags.filter { tag -> tag !in existingTags.map { it[Tags.name] } }
    val generatedTags = Tags.batchInsert(newTags) {
        this[Tags.name] = it
    }.map { it[Tags.id].value }
    listOf(existingTags.map { it[Tags.id].value }, generatedTags).flatten()
}

class ArticleService(val database: Database) {
    suspend fun create(article: CreateArticleInput, userId: UInt): ArticleDTO = database.dbQuery {
        val createdArticle = Articles.insertReturning {
            it[title] = article.title
            it[description] = article.description
            it[body] = article.body
            it[Articles.userId] = userId
        }.single()
        val articleId = createdArticle[Articles.id].value
        if (article.tagList.isNotEmpty()) {
            val tagIds = upsertTags(article.tagList)
            ArticleTags.batchInsert(tagIds) { tagId ->
                this[ArticleTags.articleId] = articleId
                this[ArticleTags.tagId] = tagId
            }
        }
        ArticleDTO(
            articleId,
            createdArticle[Articles.userId].value,
            article.title,
            article.description,
            article.body,
            article.tagList
        )
    }

    suspend fun update(id: UInt, article: UpdateArticleInput) = database.dbQuery {
        if (article.tagList != null) {
            val currentTags = ArticleTags.select(ArticleTags.tagId).where { ArticleTags.articleId eq id }
                .map { it[ArticleTags.tagId].value }
            val newTags = upsertTags(article.tagList)

            val tagsToRemove = currentTags - newTags.toSet()
            val tagsToAdd = newTags - currentTags.toSet()

            ArticleTags.deleteWhere { ArticleTags.articleId eq id and (ArticleTags.tagId inList tagsToRemove) }
            ArticleTags.batchInsert(tagsToAdd) { tagId ->
                this[ArticleTags.articleId] = id
                this[ArticleTags.tagId] = tagId
            }
        }
        Articles.update({ Articles.id eq id }) {
            if (article.title != null) it[title] = article.title
            if (article.description != null) it[description] = article.description
            if (article.body != null) it[body] = article.body
        }
    }

    suspend fun delete(id: UInt) {
        database.dbQuery {
            ArticleTags.deleteWhere { ArticleTags.articleId eq id }
            Articles.deleteWhere { Articles.id eq id }
        }
    }
}
