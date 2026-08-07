package net.axcira.features.permissions

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PermissionSatisfiesTest {
    @Test
    fun `administrator satisfies any permission`() {
        assertTrue(Permission.Administrator.satisfies(Permission.CreateArticle))
        assertTrue(Permission.Administrator.satisfies(Permission.ManageUsers))
        assertTrue(Permission.Administrator.satisfies(Permission.UpdateArticle(true)))
        assertTrue(Permission.Administrator.satisfies(Permission.DeleteArticle(false)))
    }

    @Test
    fun `manage articles satisfies article sub-permissions`() {
        assertTrue(Permission.ManageArticles.satisfies(Permission.CreateArticle))
        assertTrue(Permission.ManageArticles.satisfies(Permission.UpdateArticle(true)))
        assertTrue(Permission.ManageArticles.satisfies(Permission.DeleteArticle(false)))
        assertTrue(Permission.ManageArticles.satisfies(Permission.ManageArticles))
        assertFalse(Permission.ManageArticles.satisfies(Permission.ManageUsers))
    }

    @Test
    fun `update article allowOthers subsumption`() {
        assertTrue(Permission.UpdateArticle(true).satisfies(Permission.UpdateArticle(true)))
        assertTrue(Permission.UpdateArticle(true).satisfies(Permission.UpdateArticle(false)))
        assertTrue(Permission.UpdateArticle(false).satisfies(Permission.UpdateArticle(false)))
        assertFalse(Permission.UpdateArticle(false).satisfies(Permission.UpdateArticle(true)))
    }

    @Test
    fun `delete article allowOthers subsumption`() {
        assertTrue(Permission.DeleteArticle(true).satisfies(Permission.DeleteArticle(true)))
        assertTrue(Permission.DeleteArticle(true).satisfies(Permission.DeleteArticle(false)))
        assertFalse(Permission.DeleteArticle(false).satisfies(Permission.DeleteArticle(true)))
    }

    @Test
    fun `iterable satisfies uses any matching permission`() {
        val granted =
            listOf(
                Permission.CreateArticle,
                Permission.UpdateArticle(false),
            )
        assertTrue(granted.satisfies(Permission.CreateArticle))
        assertFalse(granted.satisfies(Permission.UpdateArticle(true)))
        assertFalse(granted.satisfies(Permission.ManageUsers))
    }
}
