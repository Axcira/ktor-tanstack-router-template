package net.axcira.features.masters.products

import kotlinx.serialization.Serializable
import net.axcira.db.Customers
import net.axcira.db.Products
import net.axcira.features.masters.FractionalIndex
import net.axcira.features.masters.MasterDeleteResult
import net.axcira.features.masters.MasterListQuery
import net.axcira.features.masters.MasterWriteResult
import net.axcira.features.masters.containsIgnoreCase
import net.axcira.features.masters.isUniqueViolation
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
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.exceptions.ExposedSQLException
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertReturning
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.updateReturning
import org.slf4j.LoggerFactory

@Serializable
data class CreateProductInput(
    val code: String,
    val name: String,
    val customerId: UInt,
    val isActive: Boolean = true,
    val sortKey: String? = null,
)

@Serializable
data class UpdateProductInput(
    val code: Optional<String> = Optional.None,
    val name: Optional<String> = Optional.None,
    val customerId: Optional<UInt> = Optional.None,
    val isActive: Optional<Boolean> = Optional.None,
)

@Serializable
data class ProductDTO(
    val id: UInt,
    val code: String,
    val name: String,
    val customerId: UInt,
    val sortKey: String,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class ProductList(
    val items: List<ProductDTO>,
    val totalCount: Long,
)

private const val DUPLICATE_CODE = "同じコードの製品が既に存在します。"
private const val DUPLICATE_SORT = "同じ並び順キーが既に存在します。"
private const val MISSING_CUSTOMER = "指定された顧客が存在しません。"

class ProductService(
    val database: Database,
) {
    private val log = LoggerFactory.getLogger(ProductService::class.java)

    suspend fun list(query: MasterListQuery): ProductList =
        database.dbQuery {
            val total = Products.selectAll().where { filter(query) }.count()
            val items =
                Products
                    .selectAll()
                    .where { filter(query) }
                    .orderBy(sortKeyOrder(Products.sortKey), Products.id to SortOrder.ASC)
                    .page(query)
                    .map { it.toDto() }
            ProductList(items = items, totalCount = total)
        }

    suspend fun get(id: UInt): ProductDTO? =
        database.dbQuery {
            Products
                .selectAll()
                .where { Products.id eq id }
                .singleOrNull()
                ?.toDto()
        }

    suspend fun create(input: CreateProductInput): MasterWriteResult<ProductDTO> =
        try {
            database.dbQuery {
                val code = input.code.trim()
                val name = input.name.trim()
                if (Customers.selectAll().where { Customers.id eq input.customerId }.empty()) {
                    return@dbQuery MasterWriteResult.Invalid(MISSING_CUSTOMER)
                }
                if (Products.selectAll().where { Products.code eq code }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_CODE)
                }
                val sortKey = input.sortKey ?: nextSortKey()
                if (Products.selectAll().where { Products.sortKey eq sortKey }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_SORT)
                }
                val now = nowUtc()
                val row =
                    Products
                        .insertReturning {
                            it[Products.code] = code
                            it[Products.name] = name
                            it[Products.customerId] = input.customerId
                            it[Products.sortKey] = sortKey
                            it[Products.isActive] = input.isActive
                            it[Products.createdAt] = now
                            it[Products.updatedAt] = now
                        }.single()
                        .toDto()
                log.info("Product created: id=${row.id}, code=\"${row.code}\"")
                MasterWriteResult.Ok(row)
            }
        } catch (e: ExposedSQLException) {
            if (!e.isUniqueViolation()) throw e
            MasterWriteResult.Conflict(if (e.message.orEmpty().contains("sort_key")) DUPLICATE_SORT else DUPLICATE_CODE)
        }

    suspend fun update(
        id: UInt,
        input: UpdateProductInput,
    ): MasterWriteResult<ProductDTO> =
        try {
            database.dbQuery {
                val untouched =
                    input.code is Optional.None &&
                        input.name is Optional.None &&
                        input.customerId is Optional.None &&
                        input.isActive is Optional.None
                if (untouched) return@dbQuery MasterWriteResult.NotModified
                if (Products.selectAll().where { Products.id eq id }.empty()) return@dbQuery MasterWriteResult.NotFound
                val code = input.code.getOrNull()?.trim()
                if (code != null && Products.selectAll().where { (Products.code eq code) and (Products.id neq id) }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_CODE)
                }
                val customerId = input.customerId.getOrNull()
                if (customerId != null && Customers.selectAll().where { Customers.id eq customerId }.empty()) {
                    return@dbQuery MasterWriteResult.Invalid(MISSING_CUSTOMER)
                }
                val row =
                    Products
                        .updateReturning(where = { Products.id eq id }) {
                            if (code != null) it[Products.code] = code
                            input.name.getOrNull()?.let { name -> it[Products.name] = name.trim() }
                            if (customerId != null) it[Products.customerId] = customerId
                            input.isActive.getOrNull()?.let { active -> it[Products.isActive] = active }
                            it[Products.updatedAt] = nowUtc()
                        }.singleOrNull()
                        ?.toDto()
                        ?: return@dbQuery MasterWriteResult.NotFound
                MasterWriteResult.Ok(row)
            }
        } catch (e: ExposedSQLException) {
            if (!e.isUniqueViolation()) throw e
            MasterWriteResult.Conflict(DUPLICATE_CODE)
        }

    suspend fun reorder(
        id: UInt,
        sortKey: String,
    ): MasterWriteResult<ProductDTO> =
        try {
            database.dbQuery {
                val current = Products.selectAll().where { Products.id eq id }.singleOrNull() ?: return@dbQuery MasterWriteResult.NotFound
                if (current[Products.sortKey] == sortKey) return@dbQuery MasterWriteResult.Ok(current.toDto())
                if (Products.selectAll().where { (Products.sortKey eq sortKey) and (Products.id neq id) }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_SORT)
                }
                val row =
                    Products
                        .updateReturning(where = { Products.id eq id }) {
                            it[Products.sortKey] = sortKey
                            it[Products.updatedAt] = nowUtc()
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
        database.dbQuery {
            if (Products.selectAll().where { Products.id eq id }.empty()) return@dbQuery MasterDeleteResult.NotFound
            val deleted = Products.deleteWhere { Products.id eq id }
            if (deleted == 0) {
                MasterDeleteResult.NotFound
            } else {
                log.info("Product deleted: id=$id")
                MasterDeleteResult.Ok
            }
        }

    suspend fun seedIfEmpty() {
        database.dbQuery {
            if (Products.selectAll().count() > 0) return@dbQuery
            val customers = Customers.selectAll().associate { it[Customers.code] to it[Customers.id].value }
            val axcira = customers["A001"] ?: return@dbQuery
            val northwind = customers["B002"] ?: return@dbQuery
            val now = nowUtc()
            var previous: String? = null
            val rows =
                listOf(
                    Triple("STD", "スタンダードプラン", axcira),
                    Triple("PRM", "プレミアムプラン", axcira),
                    Triple("SETUP", "導入支援", northwind),
                )
            Products.batchInsert(rows) { (code, name, customerId) ->
                val key = FractionalIndex.generateKeyBetween(previous, null)
                previous = key
                this[Products.code] = code
                this[Products.name] = name
                this[Products.customerId] = customerId
                this[Products.sortKey] = key
                this[Products.isActive] = true
                this[Products.createdAt] = now
                this[Products.updatedAt] = now
            }
            log.info("Seeded products")
        }
    }
}

private fun filter(query: MasterListQuery): Op<Boolean> {
    var op: Op<Boolean> = Op.TRUE
    query.q?.let { op = op and (containsIgnoreCase(Products.code, it) or containsIgnoreCase(Products.name, it)) }
    query.isActive?.let { op = op and (Products.isActive eq it) }
    return op
}

private fun nextSortKey(): String {
    val current =
        Products
            .select(Products.sortKey)
            .orderBy(sortKeyOrder(Products.sortKey).let { it.first to SortOrder.DESC })
            .limit(1)
            .firstOrNull()
            ?.get(Products.sortKey)
    return FractionalIndex.generateKeyBetween(current, null)
}

private fun org.jetbrains.exposed.v1.core.ResultRow.toDto() =
    ProductDTO(
        id = this[Products.id].value,
        code = this[Products.code],
        name = this[Products.name],
        customerId = this[Products.customerId].value,
        sortKey = this[Products.sortKey],
        isActive = this[Products.isActive],
        createdAt = this[Products.createdAt].toApiString(),
        updatedAt = this[Products.updatedAt].toApiString(),
    )

private fun org.jetbrains.exposed.v1.jdbc.Query.any() = !empty()
