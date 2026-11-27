package net.axcira.features.masters.customers

import kotlinx.serialization.Serializable
import net.axcira.db.Customers
import net.axcira.db.Products
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
data class CustomerOption(
    val id: UInt,
    val code: String,
    val name: String,
)

@Serializable
data class CreateCustomerInput(
    val code: String,
    val name: String,
    val isActive: Boolean = true,
    val sortKey: String? = null,
)

@Serializable
data class UpdateCustomerInput(
    val code: Optional<String> = Optional.None,
    val name: Optional<String> = Optional.None,
    val isActive: Optional<Boolean> = Optional.None,
)

@Serializable
data class CustomerDTO(
    val id: UInt,
    val code: String,
    val name: String,
    val sortKey: String,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class CustomerList(
    val items: List<CustomerDTO>,
    val totalCount: Long,
)

private const val DUPLICATE_CODE = "同じコードの顧客が既に存在します。"
private const val DUPLICATE_SORT = "同じ並び順キーが既に存在します。"
private const val IN_USE = "この顧客は製品から参照されているため削除できません。"

class CustomerService(
    val database: Database,
) {
    private val log = LoggerFactory.getLogger(CustomerService::class.java)

    suspend fun list(query: MasterListQuery): CustomerList =
        database.dbQuery {
            val total = Customers.selectAll().where { filter(query) }.count()
            val items =
                Customers
                    .selectAll()
                    .where { filter(query) }
                    .orderBy(sortKeyOrder(Customers.sortKey), Customers.id to SortOrder.ASC)
                    .page(query)
                    .map { it.toDto() }
            CustomerList(items = items, totalCount = total)
        }

    suspend fun get(id: UInt): CustomerDTO? =
        database.dbQuery {
            Customers
                .selectAll()
                .where { Customers.id eq id }
                .singleOrNull()
                ?.toDto()
        }

    suspend fun options(): List<CustomerOption> =
        database.dbQuery {
            Customers
                .selectAll()
                .orderBy(sortKeyOrder(Customers.sortKey), Customers.id to SortOrder.ASC)
                .map { CustomerOption(it[Customers.id].value, it[Customers.code], it[Customers.name]) }
        }

    suspend fun create(input: CreateCustomerInput): MasterWriteResult<CustomerDTO> =
        try {
            database.dbQuery {
                val code = input.code.trim()
                val name = input.name.trim()
                if (Customers.selectAll().where { Customers.code eq code }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_CODE)
                }
                val sortKey = input.sortKey ?: nextSortKey()
                if (Customers.selectAll().where { Customers.sortKey eq sortKey }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_SORT)
                }
                val now = nowUtc()
                val row =
                    Customers
                        .insertReturning {
                            it[Customers.code] = code
                            it[Customers.name] = name
                            it[Customers.sortKey] = sortKey
                            it[Customers.isActive] = input.isActive
                            it[Customers.createdAt] = now
                            it[Customers.updatedAt] = now
                        }.single()
                        .toDto()
                log.info("Customer created: id=${row.id}, code=\"${row.code}\"")
                MasterWriteResult.Ok(row)
            }
        } catch (e: ExposedSQLException) {
            if (!e.isUniqueViolation()) throw e
            MasterWriteResult.Conflict(if (e.message.orEmpty().contains("sort_key")) DUPLICATE_SORT else DUPLICATE_CODE)
        }

    suspend fun update(
        id: UInt,
        input: UpdateCustomerInput,
    ): MasterWriteResult<CustomerDTO> =
        try {
            database.dbQuery {
                if (input.code is Optional.None && input.name is Optional.None && input.isActive is Optional.None) {
                    return@dbQuery MasterWriteResult.NotModified
                }
                if (Customers.selectAll().where { Customers.id eq id }.empty()) return@dbQuery MasterWriteResult.NotFound
                val code = input.code.getOrNull()?.trim()
                if (code != null && Customers.selectAll().where { (Customers.code eq code) and (Customers.id neq id) }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_CODE)
                }
                val row =
                    Customers
                        .updateReturning(where = { Customers.id eq id }) {
                            if (code != null) it[Customers.code] = code
                            input.name.getOrNull()?.let { name -> it[Customers.name] = name.trim() }
                            input.isActive.getOrNull()?.let { active -> it[Customers.isActive] = active }
                            it[Customers.updatedAt] = nowUtc()
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
    ): MasterWriteResult<CustomerDTO> =
        try {
            database.dbQuery {
                val current = Customers.selectAll().where { Customers.id eq id }.singleOrNull() ?: return@dbQuery MasterWriteResult.NotFound
                if (current[Customers.sortKey] == sortKey) return@dbQuery MasterWriteResult.Ok(current.toDto())
                if (Customers.selectAll().where { (Customers.sortKey eq sortKey) and (Customers.id neq id) }.any()) {
                    return@dbQuery MasterWriteResult.Conflict(DUPLICATE_SORT)
                }
                val row =
                    Customers
                        .updateReturning(where = { Customers.id eq id }) {
                            it[Customers.sortKey] = sortKey
                            it[Customers.updatedAt] = nowUtc()
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
                    if (Customers.selectAll().where { Customers.id eq id }.empty()) return@dbQuery MasterDeleteResult.NotFound
                    if (!Products
                            .selectAll()
                            .where { Products.customerId eq id }
                            .limit(1)
                            .empty()
                    ) {
                        return@dbQuery MasterDeleteResult.Conflict(IN_USE)
                    }
                    val deleted = Customers.deleteWhere { Customers.id eq id }
                    if (deleted == 0) MasterDeleteResult.NotFound else MasterDeleteResult.Ok
                }.also {
                    if (it is MasterDeleteResult.Ok) log.info("Customer deleted: id=$id")
                }
        } catch (e: ExposedSQLException) {
            if (!e.isForeignKeyViolation()) throw e
            MasterDeleteResult.Conflict(IN_USE)
        }

    suspend fun seedIfEmpty() {
        database.dbQuery {
            if (Customers.selectAll().count() > 0) return@dbQuery
            val now = nowUtc()
            var previous: String? = null
            Customers.batchInsert(listOf("A001" to "株式会社アキシラ", "B002" to "ノースウインド商事")) { (code, name) ->
                val key = nextFractionalKey(previous)
                previous = key
                this[Customers.code] = code
                this[Customers.name] = name
                this[Customers.sortKey] = key
                this[Customers.isActive] = true
                this[Customers.createdAt] = now
                this[Customers.updatedAt] = now
            }
            log.info("Seeded customers")
        }
    }
}

private fun filter(query: MasterListQuery): Op<Boolean> {
    var op: Op<Boolean> = Op.TRUE
    query.q?.let { op = op and (containsIgnoreCase(Customers.code, it) or containsIgnoreCase(Customers.name, it)) }
    query.isActive?.let { op = op and (Customers.isActive eq it) }
    return op
}

private fun nextSortKey(): String {
    val current =
        Customers
            .select(Customers.sortKey)
            .orderBy(sortKeyOrder(Customers.sortKey).let { it.first to SortOrder.DESC })
            .limit(1)
            .firstOrNull()
            ?.get(Customers.sortKey)
    return nextFractionalKey(current)
}

private fun org.jetbrains.exposed.v1.core.ResultRow.toDto() =
    CustomerDTO(
        id = this[Customers.id].value,
        code = this[Customers.code],
        name = this[Customers.name],
        sortKey = this[Customers.sortKey],
        isActive = this[Customers.isActive],
        createdAt = this[Customers.createdAt].toApiString(),
        updatedAt = this[Customers.updatedAt].toApiString(),
    )

private fun org.jetbrains.exposed.v1.jdbc.Query.any() = !empty()
