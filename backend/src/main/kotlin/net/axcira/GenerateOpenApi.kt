package net.axcira

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.server.config.*
import io.ktor.server.testing.*
import kotlinx.coroutines.runBlocking
import java.io.File

fun main() {
    val testApp = TestApplication {
        environment {
            config = MapApplicationConfig(
                "ktor.deployment.port" to "8080"
                // 他に必要な設定があれば追加
            )
        }
        application {
            main() // application.yamlのmodulesに書いてある関数
        }
    }

    runBlocking {
        val response = testApp.client.get("/openapi.json")

        File("../openapi/openapi.json").also {
            it.parentFile.mkdirs()
            it.writeText(response.bodyAsText())
        }

        testApp.stop()
        println("✅ openapi.json を出力しました")
    }
}
