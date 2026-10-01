package net.axcira.plugins

import io.ktor.openapi.JsonSchema
import io.ktor.openapi.KotlinxSerializerJsonSchemaInference
import net.axcira.features.permissions.CreateRoleInput
import net.axcira.features.permissions.UpdateRoleInput
import kotlin.reflect.typeOf
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class OptionalSchemaInferenceTest {
    @Test
    fun `optional permission list uses the same schema as a plain permission list`() {
        val inference = KotlinxSerializerJsonSchemaInference.Default
        val createItems = inference.buildSchema(typeOf<CreateRoleInput>()).arrayItems("permissions")
        val updateItems = inference.buildSchema(typeOf<UpdateRoleInput>()).arrayItems("permissions")

        assertNotNull(createItems)
        assertEquals(createItems, updateItems)
    }
}

private fun JsonSchema.arrayItems(property: String): JsonSchema? =
    properties
        ?.get(property)
        ?.valueOrNull()
        ?.items
        ?.valueOrNull()
