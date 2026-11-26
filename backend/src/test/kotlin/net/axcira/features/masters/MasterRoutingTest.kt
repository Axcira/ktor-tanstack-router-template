package net.axcira.features.masters

import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.plugins.di.*
import net.axcira.assertStatus
import net.axcira.extraClient
import net.axcira.features.articles.ArticleDTO
import net.axcira.features.articles.CreateArticleInput
import net.axcira.features.masters.customers.CreateCustomerInput
import net.axcira.features.masters.customers.CustomerDTO
import net.axcira.features.masters.customers.CustomerList
import net.axcira.features.masters.customers.CustomerService
import net.axcira.features.masters.products.CreateProductInput
import net.axcira.features.masters.products.ProductDTO
import net.axcira.features.masters.products.ProductList
import net.axcira.features.masters.products.ProductService
import net.axcira.features.masters.tags.CreateTagMasterInput
import net.axcira.features.masters.tags.TagMasterDTO
import net.axcira.features.masters.tags.TagMasterList
import net.axcira.features.masters.tags.TagMasterService
import net.axcira.features.permissions.Permission
import net.axcira.login
import net.axcira.plugins.ValidationErrorBody
import net.axcira.plugins.dbQuery
import net.axcira.test
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.TransactionManager
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class MasterRoutingTest {
    @Test
    fun `tag master crud filter reorder and duplicate name`() =
        test { client ->
            login(client, "tag-master@example.com")

            val alpha =
                client
                    .post("/api/v1/tags") {
                        contentType(ContentType.Application.Json)
                        setBody(CreateTagMasterInput("Alpha"))
                    }.assertStatus(HttpStatusCode.Created)
                    .body<TagMasterDTO>()
            val beta =
                client
                    .post("/api/v1/tags") {
                        contentType(ContentType.Application.Json)
                        setBody(CreateTagMasterInput("Beta", isActive = false))
                    }.assertStatus(HttpStatusCode.Created)
                    .body<TagMasterDTO>()
            val alpine =
                client
                    .post("/api/v1/tags") {
                        contentType(ContentType.Application.Json)
                        setBody(CreateTagMasterInput("Alpine"))
                    }.body<TagMasterDTO>()

            client
                .post("/api/v1/tags") {
                    contentType(ContentType.Application.Json)
                    setBody(CreateTagMasterInput("Alpha"))
                }.assertStatus(HttpStatusCode.Conflict)
                .body<ConflictErrorBody>()
                .also { assertContains(it.message, "名前") }

            client
                .post("/api/v1/tags") {
                    contentType(ContentType.Application.Json)
                    setBody(CreateTagMasterInput("   "))
                }.assertStatus(HttpStatusCode.BadRequest)

            val listed = client.get("/api/v1/tags").assertStatus(HttpStatusCode.OK).body<TagMasterList>()
            assertEquals(3, listed.totalCount)
            assertEquals(listOf(alpha.id, beta.id, alpine.id), listed.items.map { it.id })

            val filtered =
                client.get("/api/v1/tags?q=Alp&isActive=true").body<TagMasterList>()
            assertEquals(listOf(alpha.id, alpine.id), filtered.items.map { it.id })
            assertEquals(2, filtered.totalCount)

            val page = client.get("/api/v1/tags?limit=1&offset=1").body<TagMasterList>()
            assertEquals(listOf(beta.id), page.items.map { it.id })
            assertEquals(3, page.totalCount)

            client.get("/api/v1/tags?isActive=maybe").assertStatus(HttpStatusCode.BadRequest).body<ValidationErrorBody>()

            val movedKey = FractionalIndex.generateKeyBetween(null, alpha.sortKey)
            val moved =
                client
                    .patch("/api/v1/tags/${alpine.id}/sort") {
                        contentType(ContentType.Application.Json)
                        setBody(ReorderMasterInput(movedKey))
                    }.assertStatus(HttpStatusCode.OK)
                    .body<TagMasterDTO>()
            assertEquals(movedKey, moved.sortKey)
            val reordered = client.get("/api/v1/tags").body<TagMasterList>()
            assertEquals(listOf(alpine.id, alpha.id, beta.id), reordered.items.map { it.id })

            client
                .patch("/api/v1/tags/${beta.id}/sort") {
                    contentType(ContentType.Application.Json)
                    setBody(ReorderMasterInput(movedKey))
                }.assertStatus(HttpStatusCode.Conflict)
                .body<ConflictErrorBody>()
                .also { assertContains(it.message, "並び順") }

            client
                .patch("/api/v1/tags/${beta.id}/sort") {
                    contentType(ContentType.Application.Json)
                    setBody(ReorderMasterInput("not-a-key"))
                }.assertStatus(HttpStatusCode.BadRequest)

            client
                .patch("/api/v1/tags/${alpha.id}") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"name":"Alpha Renamed"}""")
                }.assertStatus(HttpStatusCode.OK)
                .body<TagMasterDTO>()
                .also { assertEquals("Alpha Renamed", it.name) }

            client.get("/api/v1/tags/${alpha.id}").body<TagMasterDTO>().also { assertEquals("Alpha Renamed", it.name) }
            client.delete("/api/v1/tags/${beta.id}").assertStatus(HttpStatusCode.NoContent)
            client.get("/api/v1/tags/${beta.id}").assertStatus(HttpStatusCode.NotFound)
            client.delete("/api/v1/tags/999999").assertStatus(HttpStatusCode.NotFound)
        }

    @Test
    fun `deleting a tag used by an article returns 409 and article upsert still creates tags`() =
        test { client ->
            login(client, "tag-article@example.com")
            val article =
                client
                    .post("/api/v1/articles") {
                        contentType(ContentType.Application.Json)
                        setBody(CreateArticleInput("Tagged", "desc", "body", listOf("from-article", "from-article")))
                    }.assertStatus(HttpStatusCode.Created)
                    .body<ArticleDTO>()
            assertEquals(listOf("from-article"), article.tagList.map { it.name })

            val tag =
                client.get("/api/v1/tags?q=from-article").body<TagMasterList>().items.single().also {
                    assertEquals(true, it.isActive)
                    assertTrue(FractionalIndex.isValid(it.sortKey))
                }
            client
                .delete("/api/v1/tags/${tag.id}")
                .assertStatus(HttpStatusCode.Conflict)
                .body<ConflictErrorBody>()
                .also { assertContains(it.message, "記事") }

            client
                .patch("/api/v1/tags/${tag.id}") {
                    contentType(ContentType.Application.Json)
                    setBody("""{"isActive":false}""")
                }.assertStatus(HttpStatusCode.OK)
                .body<TagMasterDTO>()
                .also { assertEquals(false, it.isActive) }

            client.delete("/api/v1/articles/${article.id}").assertStatus(HttpStatusCode.NoContent)
            client.delete("/api/v1/tags/${tag.id}").assertStatus(HttpStatusCode.NoContent)
        }

    @Test
    fun `manage masters is required per master id`() =
        test { client ->
            val noPerm = extraClient()
            val customersOnly = extraClient()
            login(client, "master-admin@example.com")
            login(noPerm, "master-none@example.com", emptyList())
            login(customersOnly, "master-customers@example.com", listOf(Permission.ManageMasters(MasterIds.CUSTOMERS)))

            noPerm.get("/api/v1/tags").assertStatus(HttpStatusCode.Forbidden)
            customersOnly.get("/api/v1/tags").assertStatus(HttpStatusCode.Forbidden)
            customersOnly
                .post("/api/v1/tags") {
                    contentType(ContentType.Application.Json)
                    setBody(CreateTagMasterInput("Nope"))
                }.assertStatus(HttpStatusCode.Forbidden)

            val customer =
                customersOnly
                    .post("/api/v1/customers") {
                        contentType(ContentType.Application.Json)
                        setBody(CreateCustomerInput("C001", "顧客"))
                    }.assertStatus(HttpStatusCode.Created)
                    .body<CustomerDTO>()
            customersOnly.get("/api/v1/products").assertStatus(HttpStatusCode.Forbidden)
            client.get("/api/v1/customers/${customer.id}").assertStatus(HttpStatusCode.OK)

            val customersPermission: Permission = Permission.ManageMasters(MasterIds.CUSTOMERS)
            val tagsPermission: Permission = Permission.ManageMasters(MasterIds.TAGS)
            customersOnly
                .post("/api/v1/permissions/can-i") {
                    contentType(ContentType.Application.Json)
                    setBody(customersPermission)
                }.assertStatus(HttpStatusCode.OK)
            customersOnly
                .post("/api/v1/permissions/can-i") {
                    contentType(ContentType.Application.Json)
                    setBody(tagsPermission)
                }.assertStatus(HttpStatusCode.Forbidden)
        }

    @Test
    fun `customer and product masters reject duplicate codes and referenced deletes`() =
        test { client ->
            login(client, "coded-master@example.com")
            val first =
                client
                    .post("/api/v1/customers") {
                        contentType(ContentType.Application.Json)
                        setBody(CreateCustomerInput("A001", "同じ名前"))
                    }.body<CustomerDTO>()
            val second =
                client
                    .post("/api/v1/customers") {
                        contentType(ContentType.Application.Json)
                        setBody(CreateCustomerInput("A002", "同じ名前"))
                    }.assertStatus(HttpStatusCode.Created)
                    .body<CustomerDTO>()
            client
                .post("/api/v1/customers") {
                    contentType(ContentType.Application.Json)
                    setBody(CreateCustomerInput("A001", "別の名前"))
                }.assertStatus(HttpStatusCode.Conflict)
                .body<ConflictErrorBody>()
                .also { assertContains(it.message, "コード") }

            client
                .post("/api/v1/products") {
                    contentType(ContentType.Application.Json)
                    setBody(CreateProductInput("P001", "孤立", 999999u))
                }.assertStatus(HttpStatusCode.BadRequest)

            val product =
                client
                    .post("/api/v1/products") {
                        contentType(ContentType.Application.Json)
                        setBody(CreateProductInput("P001", "プラン", first.id))
                    }.assertStatus(HttpStatusCode.Created)
                    .body<ProductDTO>()
            assertEquals(first.id, product.customerId)

            client
                .post("/api/v1/products") {
                    contentType(ContentType.Application.Json)
                    setBody(CreateProductInput("P001", "別プラン", second.id))
                }.assertStatus(HttpStatusCode.Conflict)

            client
                .delete("/api/v1/customers/${first.id}")
                .assertStatus(HttpStatusCode.Conflict)
                .body<ConflictErrorBody>()
                .also { assertContains(it.message, "製品") }

            val found = client.get("/api/v1/products?q=プラン").body<ProductList>()
            assertEquals(1, found.totalCount)
            assertEquals(product.id, found.items.single().id)

            client.delete("/api/v1/products/${product.id}").assertStatus(HttpStatusCode.NoContent)
            client.delete("/api/v1/customers/${first.id}").assertStatus(HttpStatusCode.NoContent)
            client.get("/api/v1/customers").body<CustomerList>().also { assertEquals(listOf(second.id), it.items.map { item -> item.id }) }
        }

    @Test
    fun `seed if empty is idempotent`() =
        test { _ ->
            val database: Database by application.dependencies
            val customers = CustomerService(database)
            val products = ProductService(database)
            val tags = TagMasterService(database)
            customers.seedIfEmpty()
            products.seedIfEmpty()
            tags.seedIfEmpty()
            customers.seedIfEmpty()
            products.seedIfEmpty()
            tags.seedIfEmpty()
            val query = MasterListQuery(null, null, null, 0)
            assertEquals(2L, customers.list(query).totalCount)
            assertEquals(3L, products.list(query).totalCount)
            assertEquals(3L, tags.list(query).totalCount)
        }

    @Test
    fun `migration sort key function matches FractionalIndex`() =
        test { _ ->
            val database: Database by application.dependencies
            val sql =
                checkNotNull(MasterRoutingTest::class.java.classLoader.getResource("db/migration/V15__MASTER_DATA.sql")) {
                    "V15 migration missing"
                }.readText()
            val function =
                sql
                    .substringAfter("-- BEGIN axcira_next_sort_key")
                    .substringBefore("-- END axcira_next_sort_key")
                    .trim()
            database.dbQuery {
                val tx = TransactionManager.current()
                tx.exec(function)
                var previous: String? = null
                repeat(80) {
                    val argument = if (previous == null) "NULL" else "'${previous.replace("'", "''")}'"
                    val next =
                        tx.exec("SELECT axcira_next_sort_key($argument)") { rs ->
                            rs.next()
                            rs.getString(1)
                        }
                    assertEquals(FractionalIndex.generateKeyBetween(previous, null), next)
                    previous = next
                }
                tx.exec("DROP FUNCTION IF EXISTS axcira_next_sort_key(text)")
            }
        }
}
