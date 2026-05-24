package net.axcira.features.users

import kotlinx.coroutines.runBlocking
import net.axcira.testDbModule
import org.junit.jupiter.api.*
import org.koin.core.context.startKoin
import org.koin.core.context.stopKoin
import org.koin.test.KoinTest
import org.koin.test.inject
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class UserServiceTest : KoinTest {
    private val userService: UserService by inject()

    @BeforeEach
    fun setup() {
        startKoin {
            modules(testDbModule, userModule)
        }
    }

    @AfterEach
    fun tearDown() {
        stopKoin()
    }

    @Test
    fun `test create and find user`() = runBlocking {
        val input = CreateUserInput("test@example.com", "password")
        val created = userService.createUser(input)

        assertEquals("test@example.com", created.email)

        val found = userService.findById(created.id)
        assertNotNull(found)
        assertEquals(created.id, found.id)
        assertEquals("test@example.com", found.email)
    }
}
