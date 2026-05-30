package net.axcira.features.articles

import kotlinx.serialization.Serializable
import net.axcira.*
import net.axcira.db.*
import net.axcira.db.Articles.title
import net.axcira.plugins.*
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.*

@Serializable
data class CreateArticleInput(val title: String, val description: String, val body: String, val tagList: List<String>)

@Serializable
data class UpdateArticleInput(
    val title: Optional<String> = Optional.None,
    val description: Optional<String> = Optional.None,
    val body: Optional<String> = Optional.None,
    val tagList: Optional<List<String>> = Optional.None
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
                row[title],
                row[Articles.description],
                row[Articles.body],
                tagsByArticle[row[Articles.id].value] ?: emptyList()
            )
        }
    }

    suspend fun getById(id: UInt) = database.dbQuery {
        val article = Articles.selectAll().where { Articles.id eq id }.singleOrNull() ?: return@dbQuery null
        val tags =
            (ArticleTags innerJoin Tags).selectAll().where { ArticleTags.articleId eq id }.map { TagDTO(it[Tags.id].value, it[Tags.name]) }
        ArticleDTO(
            article[Articles.id].value,
            article[Articles.userId].value,
            article[title],
            article[Articles.description],
            article[Articles.body],
            tags
        )
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

    suspend fun update(id: UInt, article: UpdateArticleInput): UpdateResult<ArticleDTO> = database.dbQuery {
        val (title, description, body, tagList) = article
        if (arrayOf(title, description, body, tagList).all { it is Optional.None }) return@dbQuery UpdateResult.NotModified
        tagList.getOrNull()?.let { tags ->
            val currentTags = (ArticleTags innerJoin Tags).selectAll().where { ArticleTags.articleId eq id }
                .map { TagDTO(it[ArticleTags.tagId].value, it[Tags.name]) }
            val newTags = upsertTags(tags)

            val tagsToRemove = currentTags - newTags.toSet()
            val tagsToAdd = newTags - currentTags.toSet()

            ArticleTags.deleteWhere { ArticleTags.articleId eq id and (ArticleTags.tagId inList tagsToRemove.map { it.id }) }
            ArticleTags.batchInsert(tagsToAdd) { tagId ->
                this[ArticleTags.articleId] = id
                this[ArticleTags.tagId] = tagId.id
            }
        }

        if (arrayOf(title, description, body).all { it is Optional.None }) {
            // Query the article to return
            return@dbQuery Articles.selectAll().where { Articles.id eq id }.singleOrNull()?.let {
                UpdateResult.Success(
                    ArticleDTO(
                        it[Articles.id].value,
                        it[Articles.userId].value,
                        it[Articles.title],
                        it[Articles.description],
                        it[Articles.body],
                        emptyList()
                    )
                )
            } ?: return@dbQuery UpdateResult.NotFound
        }

        return@dbQuery Articles.updateReturning(where = { Articles.id eq id }) {
            if (title is Optional.Present) it[Articles.title] = title.value
            if (description is Optional.Present) it[Articles.description] = description.value
            if (body is Optional.Present) it[Articles.body] = body.value
        }.singleOrNull()?.let {
            UpdateResult.Success(
                ArticleDTO(
                    it[Articles.id].value,
                    it[Articles.userId].value,
                    it[Articles.title],
                    it[Articles.description],
                    it[Articles.body],
                    emptyList()
                )
            )
        } ?: UpdateResult.NotFound
    }

    suspend fun delete(id: UInt) {
        database.dbQuery {
            ArticleTags.deleteWhere { ArticleTags.articleId eq id }
            Articles.deleteWhere { Articles.id eq id }
        }
    }
}
