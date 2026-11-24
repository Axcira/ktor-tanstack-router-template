package net.axcira.plugins

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.sql.SQLException

class DatabaseConnectionRetryTest {
    @Test
    fun `succeeds on first attempt without sleeping`() {
        var attempts = 0
        val sleeps = mutableListOf<Long>()

        awaitJdbcConnectivity(
            jdbcUrl = "jdbc:test",
            username = "u",
            password = "p",
            delaysMs = listOf(1_000L, 3_000L),
            connect = { _, _, _ -> attempts++ },
            sleeper = { sleeps += it },
        )

        assertEquals(1, attempts)
        assertEquals(emptyList<Long>(), sleeps)
    }

    @Test
    fun `retries with configured delays then succeeds`() {
        var attempts = 0
        val sleeps = mutableListOf<Long>()

        awaitJdbcConnectivity(
            jdbcUrl = "jdbc:test",
            username = "u",
            password = "p",
            delaysMs = listOf(10L, 20L),
            connect = { _, _, _ ->
                attempts++
                if (attempts < 3) error("db not ready")
            },
            sleeper = { sleeps += it },
        )

        assertEquals(3, attempts)
        assertEquals(listOf(10L, 20L), sleeps)
    }

    @Test
    fun `throws after exhausting attempts`() {
        val sleeps = mutableListOf<Long>()

        val error =
            assertThrows(SQLException::class.java) {
                awaitJdbcConnectivity(
                    jdbcUrl = "jdbc:test",
                    username = "u",
                    password = "p",
                    delaysMs = listOf(5L, 7L),
                    connect = { _, _, _ -> error("still down") },
                    sleeper = { sleeps += it },
                )
            }

        assertEquals("Failed to connect to database after 3 attempts", error.message)
        assertEquals(listOf(5L, 7L), sleeps)
    }
}
