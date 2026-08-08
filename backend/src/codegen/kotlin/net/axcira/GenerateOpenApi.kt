package net.axcira

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.server.testing.*
import kotlinx.coroutines.runBlocking
import java.io.File

fun main() {
    val testApp =
        TestApplication {
            configure()
        }

    runBlocking {
        val response = testApp.client.get("/openapi.json")

        File("generated/openapi.json").also {
            it.parentFile.mkdirs()
            it.writeText(response.bodyAsText())
        }

        testApp.stop()
        println("openapi.json generated successfully.")
    }
}
