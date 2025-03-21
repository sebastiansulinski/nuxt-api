import { addImportsDir, addRouteMiddleware, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import defu from 'defu'
import type { ModuleOptions } from './runtime/types/ModuleOptions'
import { MODULE_CONFIG_KEY, MODULE_NAME } from './runtime/helpers/config'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: MODULE_NAME,
    configKey: MODULE_CONFIG_KEY,
  },
  defaults: {
    userStateKey: 'user',
    fetchOptions: {
      retryAttempts: false,
    },
    csrf: {
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-XSRF-TOKEN',
    },
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/api/login',
      logout: '/api/logout',
      user: '/api/user',
    },
    redirect: {
      intendedEnabled: false,
      login: '/login',
      guest: '/',
      postLogin: '/',
      postLogout: '/login',
    },
    middlewareNames: {
      auth: 'auth',
      guest: 'guest',
    },
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const runtimeDir = resolver.resolve('./runtime')
    nuxt.options.build.transpile.push(runtimeDir)

    const moduleOptions: ModuleOptions = defu(
      nuxt.options.runtimeConfig.public[MODULE_CONFIG_KEY] || {},
      options,
    )

    nuxt.options.runtimeConfig.public[MODULE_CONFIG_KEY] = moduleOptions

    addPlugin(resolver.resolve('./runtime/plugin'))
    addImportsDir(resolver.resolve('./runtime/composables'))

    addRouteMiddleware({
      name: moduleOptions.middlewareNames.auth,
      path: resolver.resolve('./runtime/middleware/auth'),
    })

    addRouteMiddleware({
      name: moduleOptions.middlewareNames.guest,
      path: resolver.resolve('./runtime/middleware/guest'),
    })
  },
})
