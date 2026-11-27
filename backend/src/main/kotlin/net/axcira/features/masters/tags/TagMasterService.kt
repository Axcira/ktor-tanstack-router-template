package net.axcira.features.masters.tags

import kotlinx.serialization.Serializable
import net.axcira.db.ArticleTags
import net.axcira.db.Tags
import net.axcira.features.masters.MasterDeleteResult
import net.axcira.features.masters.MasterListQuery
import net.axcira.features.masters.MasterWriteResult
import net.axcira.features.masters.containsIgnoreCase
import net.axcira.features.masters.isForeignKeyViolation
import net.axcira.features.masters.isUniqueViolation
import net.axcira.features.masters.nextFractionalKey
import net.axcira.features.masters.nowUtc
import net.axcira.features.masters.page
import net.axcira.features.masters.sortKeyOrder
import net.axcira.features.masters.toApiString
import net.axcira.plugins.Optional
import net.axcira.plugins.dbQuery
import net.axcira.plugins.getOrNull
import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.neq
import org.jetbrains.exposed.v1.exceptions.ExposedSQLException
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.Query
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.slf4j.LoggerFactory

@Serializable
data class CreateTagMasterInput(
    val name: String,
    val isActive: Boolean = true,
    val sortKey: String? = null,
)

@Serializable
data class UpdateTagMasterInput(
    val name: Optional<String> = Optional.None,
    val isActive: Optional<Boolean> = Optional.None,
)

@Serializable
data class TagMasterDTO(
    val id: UInt,
    val name: String,
    val sortKey: String,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class TagMasterList(
    val items: List<TagMasterDTO>,
    val totalCount: Long,
)

private const val DUPLICATE_NAME = "同じ名前のタグが既に存在します。"
private const val DUPLICATE_SORT = "同じ並び順キーが既に存在します。"
private const val IN_USE = "このタグは記事で使用されているため削除できません。"

class TagMasterService(
    val database: Database,
) {
    private val log = LoggerFactory.getLogger(TagMasterService::class.java)

    suspend fun list(query: MasterListQuery): TagMasterList =
        database.dbQuery {
            val total = Tags.selectAll().where { filter(query) }.count()
            val items =
                Tags
                    .selectAll()
                    .where { filter(query) }
                    .orderBy(sortKeyOrder(Tags.sortKey), Tags.id to SortOrder.ASC)
                    .page(query)
                    .map { it.toDto() }
            TagMasterList(items = items, totalCount = total)
        }

    suspend fun get(id: UInt): TagMasterDTO? =
        database.dbQuery {
            Tags
                .selectAll()
                .where { Tags.id eq id }
                .singleOrNull()
                ?.toDto()
        }

    suspend fun create(input: CreateTagMasterInput): MasterWriteResult<TagMasterDTO> =
        try {
            database.dbQuery {
                val name = input.name.trim()
                if (Tags.selectAll().where { Tags.name eq name }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_NAME)
                }
                val sortKey = input.sortKey ?: nextSortKey()
                if (Tags.selectAll().where { Tags.sortKey eq sortKey }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_SORT)
                }
                val now = nowUtc()
                val row =
                    Tags
                        .insertReturning {
                            it[Tags.name] = name
                            it[Tags.sortKey] = sortKey
                            it[Tags.isActive] = input.isActive
                            it[Tags.createdAt] = now
                            it[Tags.updatedAt] = now
                        }.single()
                        .toDto()
                log.info("Tag master created: id=${row.id}, name=\"${row.name}\"")
                MasterWriteResult.Ok(row)
            }
        } catch (e: ExposedSQLException) {
            if (!e.isUniqueViolation()) throw e
            MasterWriteResult.Conflict(if (e.message.orEmpty().contains("sort_key")) DUPLICATE_SORT else DUPLICATE_NAME)
        }

    suspend fun update(
        id: UInt,
        input: UpdateTagMasterInput,
    ): MasterWriteResult<TagMasterDTO> =
        try {
            database.dbQuery {
                if (input.name is Optional.None && input.isActive is Optional.None) return@dbQuery MasterWriteResult.NotModified
                if (Tags.selectAll().where { Tags.id eq id }.empty()) return@dbQuery MasterWriteResult.NotFound
                val name = input.name.getOrNull()?.trim()
                if (name != null && Tags.selectAll().where { (Tags.name eq name) and (Tags.id neq id) }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_NAME)
                }
                val row =
                    Tags
                        .updateReturning(where = { Tags.id eq id }) {
                            if (name != null) it[Tags.name] = name
                            input.isActive.getOrNull()?.let { active -> it[Tags.isActive] = active }
                            it[Tags.updatedAt] = nowUtc()
                        }.singleOrNull()
                        ?.toDto()
                        ?: return@dbQuery MasterWriteResult.NotFound
                MasterWriteResult.Ok(row)
            }
        } catch (e: ExposedSQLException) {
            if (!e.isUniqueViolation()) throw e
            MasterWriteResult.Conflict(DUPLICATE_NAME)
        }

    suspend fun reorder(
        id: UInt,
        sortKey: String,
    ): MasterWriteResult<TagMasterDTO> =
        try {
            database.dbQuery {
                val current = Tags.selectAll().where { Tags.id eq id }.singleOrNull() ?: return@dbQuery MasterWriteResult.NotFound
                if (current[Tags.sortKey] == sortKey) return@dbQuery MasterWriteResult.Ok(current.toDto())
                if (Tags.selectAll().where { (Tags.sortKey eq sortKey) and (Tags.id neq id) }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_SORT)
                }
                val row =
                    Tags
                        .updateReturning(where = { Tags.id eq id }) {
                            it[Tags.sortKey] = sortKey
                            it[Tags.updatedAt] = nowUtc()
                        }.singleOrNull()
                        ?.toDto()
                        ?: return@dbQuery MasterWriteResult.NotFound
                MasterWriteResult.Ok(row)
            }
        } catch (e: ExposedSQLException) {
            if (!e.isUniqueViolation()) throw e
            MasterWriteResult.Conflict(DUPLICATE_SORT)
        }

    suspend fun delete(id: UInt): MasterDeleteResult =
        try {
            database
                .dbQuery {
                    if (Tags.selectAll().where { Tags.id eq id }.empty()) return@dbQuery MasterDeleteResult.NotFound
                    if (!ArticleTags
                            .selectAll()
                            .where { ArticleTags.tagId eq id }
                            .limit(1)
                            .empty()
                    ) {
                        return@dbQuery MasterDeleteResult.Conflict(IN_USE)
                    }
                    val deleted = Tags.deleteWhere { Tags.id eq id }
                    if (deleted == 0) MasterDeleteResult.NotFound else MasterDeleteResult.Ok
                }.also {
                    if (it is MasterDeleteResult.Ok) log.info("Tag master deleted: id=$id")
                }
        } catch (e: ExposedSQLException) {
            if (!e.isForeignKeyViolation()) throw e
            MasterDeleteResult.Conflict(IN_USE)
        }

    suspend fun seedIfEmpty() {
        database.dbQuery {
            if (Tags.selectAll().count() > 0) return@dbQuery
            val now = nowUtc()
            var previous: String? = null
            Tags.batchInsert(listOf("お知らせ", "技術", "社内")) { name ->
                val key = nextFractionalKey(previous)
                previous = key
                this[Tags.name] = name
                this[Tags.sortKey] = key
                this[Tags.isActive] = true
                this[Tags.createdAt] = now
                this[Tags.updatedAt] = now
            }
            log.info("Seeded tag masters")
        }
    }
}

private fun filter(query: MasterListQuery): Op<Boolean> {
    var op: Op<Boolean> = Op.TRUE
    query.q?.let { op = op and containsIgnoreCase(Tags.name, it) }
    query.isActive?.let { op = op and (Tags.isActive eq it) }
    return op
}

private fun nextSortKey(): String {
    val current =
        Tags
            .select(Tags.sortKey)
            .orderBy(sortKeyOrder(Tags.sortKey).let { it.first to SortOrder.DESC })
            .limit(1)
            .firstOrNull()
            ?.get(Tags.sortKey)
    return nextFractionalKey(current)
}

private fun org.jetbrains.exposed.v1.core.ResultRow.toDto() =
    TagMasterDTO(
        id = this[Tags.id].value,
        name = this[Tags.name],
        sortKey = this[Tags.sortKey],
        isActive = this[Tags.isActive],
        createdAt = this[Tags.createdAt].toApiString(),
        updatedAt = this[Tags.updatedAt].toApiString(),
    )

private fun Query.any() = !empty()
