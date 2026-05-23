package net.axcira.features.auth

import org.koin.dsl.module

val authModule = module {
    single { AuthService(get()) }
}
