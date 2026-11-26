package net.axcira.features.masters

import kotlin.math.roundToInt

/**
 * Default-alphabet port of [fractional-indexing](https://github.com/rocicorp/fractional-indexing) (CC0).
 *
 * `generateKeyBetween(null, null)` is `"a0"`. Keys sort with ordinary byte order, which PostgreSQL
 * `COLLATE "C"` matches. The frontend calls the same library with its default digits.
 */
object FractionalIndex {
    const val MAX_LENGTH = 255

    private const val DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    private const val INT_DIGITS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    private val zero = DIGITS[0]
    private val smallestInteger = INT_DIGITS[0] + zero.toString().repeat(INT_DIGITS.length / 2)

    fun isValid(key: String): Boolean {
        if (key.isEmpty() || key.length > MAX_LENGTH) return false
        return try {
            validateOrderKey(key)
            true
        } catch (_: IllegalArgumentException) {
            false
        }
    }

    fun generateKeyBetween(
        a: String?,
        b: String?,
    ): String {
        var lower = a
        var upper = b
        if (lower != null) validateOrderKey(lower)
        if (upper != null) validateOrderKey(upper)
        if (lower != null && upper != null && lower > upper) {
            val swap = lower
            lower = upper
            upper = swap
        }

        if (lower == null) {
            if (upper == null) {
                return INT_DIGITS[INT_DIGITS.length / 2].toString() + zero
            }
            val ib = integerPart(upper)
            val fb = upper.substring(ib.length)
            if (ib == smallestInteger) return ib + midpoint("", fb)
            if (ib < upper) return ib
            return decrementInteger(ib) ?: throw IllegalArgumentException("cannot decrement any more")
        }

        if (upper == null) {
            val ia = integerPart(lower)
            val fa = lower.substring(ia.length)
            return incrementInteger(ia) ?: (ia + midpoint(fa, null))
        }

        val ia = integerPart(lower)
        val fa = lower.substring(ia.length)
        val ib = integerPart(upper)
        val fb = upper.substring(ib.length)
        if (ia == ib) return ia + midpoint(fa, fb)
        val incremented = incrementInteger(ia) ?: throw IllegalArgumentException("cannot increment any more")
        if (incremented < upper) return incremented
        return ia + midpoint(fa, null)
    }

    private fun midpoint(
        a: String,
        b: String?,
    ): String {
        if (b != null && a >= b) throw IllegalArgumentException("$a >= $b")
        if (a.lastOrNull() == zero || (b != null && b.last() == zero)) {
            throw IllegalArgumentException("trailing zero")
        }
        if (b != null) {
            var n = 0
            while ((if (n < a.length) a[n] else zero) == b.getOrNull(n)) n++
            if (n > 0) return b.substring(0, n) + midpoint(a.substring(n.coerceAtMost(a.length)), b.substring(n))
        }
        val digitA = if (a.isEmpty()) 0 else DIGITS.indexOf(a[0]).also { if (it < 0) throw IllegalArgumentException("invalid digit") }
        val digitB =
            if (b == null) {
                DIGITS.length
            } else {
                DIGITS.indexOf(b[0]).also { if (it < 0) throw IllegalArgumentException("invalid digit") }
            }
        if (digitB - digitA > 1) {
            return DIGITS[((digitA + digitB) / 2.0).roundToInt()].toString()
        }
        if (b != null && b.length > 1) return b.substring(0, 1)
        return DIGITS[digitA] + midpoint(if (a.isEmpty()) "" else a.substring(1), null)
    }

    private fun integerLength(head: Char): Int {
        val i = INT_DIGITS.indexOf(head)
        if (i < 0) throw IllegalArgumentException("invalid order key head: $head")
        val half = INT_DIGITS.length / 2
        return if (i < half) half - i + 1 else i - half + 2
    }

    private fun integerPart(key: String): String {
        if (key.isEmpty()) throw IllegalArgumentException("invalid order key: $key")
        val length = integerLength(key[0])
        if (length > key.length) throw IllegalArgumentException("invalid order key: $key")
        return key.substring(0, length)
    }

    private fun validateInteger(value: String) {
        if (value.isEmpty() || value.length != integerLength(value[0])) {
            throw IllegalArgumentException("invalid integer part of order key: $value")
        }
    }

    private fun validateOrderKey(key: String) {
        if (key == smallestInteger) throw IllegalArgumentException("invalid order key: $key")
        val head = integerPart(key)
        val fraction = key.substring(head.length)
        if (fraction.lastOrNull() == zero) throw IllegalArgumentException("invalid order key: $key")
    }

    private fun incrementInteger(value: String): String? {
        validateInteger(value)
        val head = value[0]
        var trailing = ""
        for (i in value.length - 1 downTo 1) {
            val index = DIGITS.indexOf(value[i])
            if (index < 0) throw IllegalArgumentException("invalid digit")
            val next = index + 1
            if (next == DIGITS.length) {
                trailing = zero + trailing
            } else {
                return head + value.substring(1, i) + DIGITS[next] + trailing
            }
        }
        val headIndex = INT_DIGITS.indexOf(head)
        if (headIndex == INT_DIGITS.length - 1) return null
        val nextHead = INT_DIGITS[headIndex + 1]
        val lengthDelta = integerLength(nextHead) - integerLength(head)
        return nextHead +
            when {
                lengthDelta > 0 -> trailing + zero
                lengthDelta < 0 -> trailing.drop(1)
                else -> trailing
            }
    }

    private fun decrementInteger(value: String): String? {
        validateInteger(value)
        val head = value[0]
        val last = DIGITS.last()
        var trailing = ""
        for (i in value.length - 1 downTo 1) {
            val index = DIGITS.indexOf(value[i])
            if (index < 0) throw IllegalArgumentException("invalid digit")
            val next = index - 1
            if (next == -1) {
                trailing = last + trailing
            } else {
                return head + value.substring(1, i) + DIGITS[next] + trailing
            }
        }
        val headIndex = INT_DIGITS.indexOf(head)
        if (headIndex == 0) return null
        val nextHead = INT_DIGITS[headIndex - 1]
        val lengthDelta = integerLength(nextHead) - integerLength(head)
        return nextHead +
            when {
                lengthDelta > 0 -> trailing + last
                lengthDelta < 0 -> trailing.drop(1)
                else -> trailing
            }
    }
}
