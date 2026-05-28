package net.axcira.features.articles

import kotlinx.html.Entities
import kotlinx.serialization.Serializable
import net.axcira.Pagination
import net.axcira.db.*
import net.axcira.paginate
import net.axcira.plugins.dbQuery
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.*

@Serializable
data class CreateArticleInput(val title: String, val description: String, val body: String, val tagList: List<String>)

@Serializable
data class UpdateArticleInput(
    val title: String?, val description: String?, val body: String?, val tagList: List<String>?
)

@Serializable
data class TagDTO(val id: UInt, val name: String)

@Serializable
data class ArticleDTO(
    val id: UInt, val userId: UInt, val title: String, val description: String, val body: String, val tagList: List<TagDTO>
)

private fun upsertTags(tags: List<String>) = run {
    val existingTags = Tags.selectAll().where { Tags.name inList tags }.toList()
    val newTags = tags.filter { tag -> tag !in existingTags.map { it[Tags.name] } }
    val generatedTags = Tags.batchInsert(newTags) {
        this[Tags.name] = it
    }.map { TagDTO(it[Tags.id].value, it[Tags.name]) }
    listOf(existingTags.map { TagDTO(it[Tags.id].value, it[Tags.name]) }, generatedTags).flatten()
}

class ArticleService(val database: Database) {
    suspend fun get(pagination: Pagination): List<ArticleDTO> = database.dbQuery {
        val articles = Articles.selectAll().paginate(pagination).toList()
        val tagsByArticle = (ArticleTags innerJoin Tags).selectAll().where { ArticleTags.articleId inList articles.map { it[Articles.id] } }
            .groupBy({ it[ArticleTags.articleId].value }, { TagDTO(it[Tags.id].value, it[Tags.name]) })

        articles.map { row ->
            ArticleDTO(
                row[Articles.id].value,
                row[Articles.userId].value,
                row[Articles.title],
                row[Articles.description],
                row[Articles.body],
                tagsByArticle[row[Articles.id].value] ?: emptyList()
            )
        }
    }

    suspend fun getById(id: UInt) = database.dbQuery {
        val article = Articles.selectAll().where { Articles.id eq id }.singleOrNull() ?: return@dbQuery null
        val tags = (ArticleTags innerJoin Tags).selectAll().where { ArticleTags.articleId eq id }
            .map { TagDTO(it[Tags.id].value, it[Tags.name]) }
        ArticleDTO(article[Articles.id].value, article[Articles.userId].value, article[Articles.title], article[Articles.description], article[Articles.body], tags)
    }

    suspend fun create(article: CreateArticleInput, userId: UInt): ArticleDTO = database.dbQuery {
        val createdArticle = Articles.insertReturning {
            it[title] = article.title
            it[description] = article.description
            it[body] = article.body
            it[Articles.userId] = userId
        }.single()
        val articleId = createdArticle[Articles.id].value
        val tags: List<TagDTO>
        if (article.tagList.isNotEmpty()) {
            val tagIds = upsertTags(article.tagList)
            ArticleTags.batchInsert(tagIds) { tagId ->
                this[ArticleTags.articleId] = articleId
                this[ArticleTags.tagId] = tagId.id
            }
            tags = tagIds
        } else {
            tags = emptyList()
        }
        ArticleDTO(
            articleId, createdArticle[Articles.userId].value, article.title, article.description, article.body, tags
        )
    }

    suspend fun update(id: UInt, article: UpdateArticleInput): ArticleDTO? = database.dbQuery {
        if (article.tagList != null) {
            val currentTags = (ArticleTags innerJoin Tags).selectAll().where { ArticleTags.articleId eq id }
                .map { TagDTO(it[ArticleTags.tagId].value, it[Tags.name]) }
            val newTags = upsertTags(article.tagList)

            val tagsToRemove = currentTags - newTags.toSet()
            val tagsToAdd = newTags - currentTags.toSet()

            ArticleTags.deleteWhere { ArticleTags.articleId eq id and (ArticleTags.tagId inList tagsToRemove.map { it.id }) }
            ArticleTags.batchInsert(tagsToAdd) { tagId ->
                this[ArticleTags.articleId] = id
                this[ArticleTags.tagId] = tagId.id
            }
        }
        val (title, description, body) = article
        if (title == null && description == null && body == null) return@dbQuery null

        return@dbQuery Articles.updateReturning(where = { Articles.id eq id }) {
            if (title != null) it[Articles.title] = title
            if (description != null) it[Articles.description] = description
            if (body != null) it[Articles.body] = body
        }.single().let {
            ArticleDTO(
                it[Articles.id].value,
                it[Articles.userId].value,
                it[Articles.title],
                it[Articles.description],
                it[Articles.body],
                emptyList()
            )
        }
    }

    suspend fun delete(id: UInt) {
        database.dbQuery {
            ArticleTags.deleteWhere { ArticleTags.articleId eq id }
            Articles.deleteWhere { Articles.id eq id }
        }
    }
}
