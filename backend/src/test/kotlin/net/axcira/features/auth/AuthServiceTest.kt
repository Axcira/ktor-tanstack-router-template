package net.axcira.features.auth

import kotlinx.coroutines.runBlocking
import net.axcira.features.users.*
import net.axcira.testDbModule
import org.junit.jupiter.api.*
import org.koin.core.context.startKoin
import org.koin.core.context.stopKoin
import org.koin.test.KoinTest
import org.koin.test.inject
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class AuthServiceTest : KoinTest {
    private val authService: AuthService by inject()
    private val userService: UserService by inject()

    @BeforeEach
    fun setup() {
        startKoin {
            modules(testDbModule, userModule, authModule)
        }
    }

    @AfterEach
    fun tearDown() {
        stopKoin()
    }

    @Test
    fun `test login success`(): Unit = runBlocking {
        val email = "auth-test@example.com"
        val password = "password"
        userService.createUser(CreateUserInput(email, password))

        val session = authService.login(email, password)
        assertNotNull(session)
    }

    @Test
    fun `test login failure - wrong password`() = runBlocking {
        val email = "auth-fail@example.com"
        val password = "password"
        userService.createUser(CreateUserInput(email, password))

        val session = authService.login(email, "wrong-password")
        assertNull(session)
    }
}
