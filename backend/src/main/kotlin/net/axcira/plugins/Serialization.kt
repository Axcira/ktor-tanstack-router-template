package net.axcira.plugins

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlinx.serialization.*
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.json.Json
import net.axcira.plugins.Optional.None
import net.axcira.plugins.Optional.Present

@Serializable(with = OptionalPropertySerializer::class)
sealed interface Optional<out T> {
    object None : Optional<Nothing>
    data class Present<T>(val value: T) : Optional<T>
}

fun Optional<*>.isPresent() = this is Present<*>
fun Optional<*>.isNone() = this is None
fun <T> Optional<T>.getOrNull() = (this as? Present)?.value

class OptionalPropertySerializer<T>(
    private val valueSerializer: KSerializer<T>
) : KSerializer<Optional<T>> {
    override val descriptor: SerialDescriptor = valueSerializer.descriptor
    override fun deserialize(decoder: Decoder): Optional<T> {
        return Present(valueSerializer.deserialize(decoder))
    }

    override fun serialize(encoder: kotlinx.serialization.encoding.Encoder, value: Optional<T>) {
        when (value) {
            is None -> {
                throw SerializationException("Cannot serialize None")
            }

            is Present -> {
                valueSerializer.serialize(encoder, value.value)
            }
        }
    }
}

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            encodeDefaults = false
            explicitNulls = true
        })
    }
}
