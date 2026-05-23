package net.axcira.features.users

import org.koin.dsl.module

val userModule = module {
    single { UserService(get()) }
}
