package net.axcira.features.permissions

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PermissionSatisfiesTest {
    @Test
    fun `administrator satisfies any permission`() {
        assertTrue(Permission.Administrator.satisfies(Permission.CreateArticle))
        assertTrue(Permission.Administrator.satisfies(Permission.ManageUsers))
        assertTrue(Permission.Administrator.satisfies(Permission.ManageRoles))
        assertTrue(Permission.Administrator.satisfies(Permission.ChangePassword))
        assertTrue(Permission.Administrator.satisfies(Permission.UpdateArticle(true)))
        assertTrue(Permission.Administrator.satisfies(Permission.DeleteArticle(false)))
        assertTrue(Permission.Administrator.satisfies(Permission.ManageMasters("tags")))
    }

    @Test
    fun `manage masters matches only the same master id`() {
        assertTrue(Permission.ManageMasters("tags").satisfies(Permission.ManageMasters("tags")))
        assertFalse(Permission.ManageMasters("tags").satisfies(Permission.ManageMasters("customers")))
        assertFalse(Permission.ManageMasters("customers").satisfies(Permission.ManageMasters("products")))
        assertFalse(Permission.ManageMasters("tags").satisfies(Permission.ManageUsers))
        assertFalse(Permission.ManageArticles.satisfies(Permission.ManageMasters("tags")))
        val granted = listOf(Permission.ManageMasters("products"))
        assertTrue(granted.satisfies(Permission.ManageMasters("products")))
        assertFalse(granted.satisfies(Permission.ManageMasters("tags")))
    }

    @Test
    fun `change password is not implied by manage users`() {
        assertTrue(Permission.ChangePassword.satisfies(Permission.ChangePassword))
        assertFalse(Permission.ManageUsers.satisfies(Permission.ChangePassword))
        assertFalse(Permission.ManageUsers.satisfies(Permission.ManageRoles))
        assertFalse(Permission.ManageRoles.satisfies(Permission.ManageUsers))
        assertFalse(Permission.ChangePassword.satisfies(Permission.ManageUsers))
        assertFalse(Permission.ManageArticles.satisfies(Permission.ChangePassword))
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
