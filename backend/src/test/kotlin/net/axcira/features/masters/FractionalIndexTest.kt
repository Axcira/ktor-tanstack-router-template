package net.axcira.features.masters

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class FractionalIndexTest {
    @Test
    fun `default keys match fractional-indexing`() {
        assertEquals("a0", FractionalIndex.generateKeyBetween(null, null))
        assertEquals("a1", FractionalIndex.generateKeyBetween("a0", null))
        assertEquals("a2", FractionalIndex.generateKeyBetween("a1", null))
        assertEquals("Zz", FractionalIndex.generateKeyBetween(null, "a0"))
        assertEquals("a0V", FractionalIndex.generateKeyBetween("a0", "a1"))
        assertEquals("a1V", FractionalIndex.generateKeyBetween("a1", "a2"))
        assertEquals("b00", FractionalIndex.generateKeyBetween("az", null))
    }

    @Test
    fun `appended keys stay ordered`() {
        var previous: String? = null
        val keys = mutableListOf<String>()
        repeat(80) {
            val next = FractionalIndex.generateKeyBetween(previous, null)
            keys += next
            previous = next
        }
        assertEquals(keys, keys.sorted())
        assertEquals(keys.toSet().size, keys.size)
        assertTrue(keys.all { FractionalIndex.isValid(it) })
    }

    @Test
    fun `rejects blank trailing-zero and oversized keys`() {
        assertFalse(FractionalIndex.isValid(""))
        assertFalse(FractionalIndex.isValid("nope"))
        assertFalse(FractionalIndex.isValid("a0" + "0"))
        assertFalse(FractionalIndex.isValid("a".repeat(FractionalIndex.MAX_LENGTH + 1)))
        assertTrue(FractionalIndex.isValid("a0"))
        assertTrue(FractionalIndex.isValid("a3"))
        assertFalse(FractionalIndex.isValid("a~"))
        assertTrue(FractionalIndex.isValid("a0V"))
    }
}
