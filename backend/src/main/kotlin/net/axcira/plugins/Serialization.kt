package net.axcira.plugins

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlinx.serialization.*
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.StructureKind
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.json.Json
import net.axcira.plugins.Optional.None
import net.axcira.plugins.Optional.Present

@Serializable(with = OptionalPropertySerializer::class)
sealed interface Optional<out T> {
    object None : Optional<Nothing>

    data class Present<T>(
        val value: T,
    ) : Optional<T>
}

fun Optional<*>.isPresent() = this is Present<*>

fun Optional<*>.isNone() = this is None

fun <T> Optional<T>.getOrNull() = (this as? Present)?.value

class OptionalPropertySerializer<T>(
    private val valueSerializer: KSerializer<T>,
) : KSerializer<Optional<T>> {
    override val descriptor: SerialDescriptor = valueSerializer.descriptor

    // Ktor OpenAPI inference reads `elementSerializer` to walk list descriptors.
    // Optional delegates its descriptor to valueSerializer, so this field keeps
    // Optional<List<T>> on the same schema as List<T> (avoids a second component such as Permission2).
    @Suppress("unused")
    private val elementSerializer: KSerializer<*>? = listElementSerializer(valueSerializer)

    override fun deserialize(decoder: Decoder): Optional<T> = Present(valueSerializer.deserialize(decoder))

    override fun serialize(
        encoder: kotlinx.serialization.encoding.Encoder,
        value: Optional<T>,
    ) {
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

private fun listElementSerializer(serializer: KSerializer<*>): KSerializer<*>? {
    if (serializer.descriptor.kind != StructureKind.LIST) return null
    var current: Class<*>? = serializer.javaClass
    while (current != null) {
        val field = current.declaredFields.firstOrNull { it.name == "elementSerializer" }
        if (field != null && field.trySetAccessible()) {
            return field.get(serializer) as? KSerializer<*>
        }
        current = current.superclass
    }
    return null
}

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(
            Json {
                encodeDefaults = false
                explicitNulls = true
            },
        )
    }
}
