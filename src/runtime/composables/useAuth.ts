import type { FetchOptions } from 'ofetch'
import { computed } from 'vue'
import type { Auth } from '../types/Auth'
import { useHttp } from '../composables/useHttp'
import { useApiOptions } from '../composables/useApiOptions'
import { useCurrentUser } from '../composables/useCurrentUser'
import { getAuthUser } from '../services/getAuthUser'
import { navigateTo, useRoute } from '#app'

export const useAuth = <T>(): Auth<T> => {
  const options = useApiOptions()
  const { post, processing, errorBag } = useHttp()
  const user = useCurrentUser<T>()

  const isLoggedIn = computed(() => {
    return user.value !== null
  })

  const refreshUser = async () => {
    try {
      user.value = await getAuthUser()
    }
    catch (error) {
      user.value = null
      console.debug(error)
    }
  }

  const login = async <LoginApiResponse>(
    credentials: Record<string, string>,
    clientOptions: FetchOptions = {},
    callback?: (responseData: LoginApiResponse, user: T | null) => unknown,
  ) => {
    const { redirect, endpoints } = options
    const currentRoute = useRoute()

    if (isLoggedIn.value) {
      if (
        !redirect.postLogin
        || redirect.postLogin === currentRoute.path
      ) {
        return
      }

      return navigateTo(redirect.postLogin)
    }

    const response = await post<LoginApiResponse>(
      endpoints.login,
      credentials,
      clientOptions as object,
    )

    await refreshUser()

    if (callback) {
      return callback(response, user.value)
    }

    if (redirect.intendedEnabled) {
      const requestedRoute = currentRoute.query.redirect
      if (requestedRoute && requestedRoute !== currentRoute.path) {
        return navigateTo(requestedRoute as string)
      }
    }

    if (
      !redirect.postLogin
      || currentRoute.path === redirect.postLogin
    ) {
      return
    }

    return navigateTo(redirect.postLogin)
  }

  const logout = async (callback?: () => undefined): Promise<void> => {
    if (!isLoggedIn.value) {
      return
    }

    await post(options.endpoints.logout)

    user.value = null

    if (callback) {
      return callback()
    }

    const currentPath = useRoute().path

    if (
      !options.redirect.postLogout
      || currentPath === options.redirect.postLogout
    ) {
      return
    }

    await navigateTo(options.redirect.postLogout as string)
  }

  return {
    user,
    isLoggedIn,
    refreshUser,
    login,
    logout,
    processing,
    errorBag,
  }
}
