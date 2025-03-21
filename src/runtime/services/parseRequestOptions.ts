import { type FetchContext, type FetchOptions } from 'ofetch'
import { useApiOptions } from '../composables/useApiOptions'
import type { ModuleOptions } from '../types/ModuleOptions'
import { useCookie, useRequestHeaders, useRequestURL } from '#app'
import type {CookieRef} from "#app/composables/cookie";
import {useErrorBag} from "../composables/useErrorBag";

/**
 * Get credentials.
 */
const getCredentials = (): RequestCredentials | undefined => {
  return 'credentials' in Request.prototype ? 'include' : undefined
}

/**
 * Fetch and initialize the CSRF cookie.
 */
const fetchCsrfCookie = async (
  config: ModuleOptions,
): Promise<void> => {
  try {
    await $fetch(config.endpoints.csrf, {
      baseURL: config.apiBaseURL,
      credentials: 'include',
    })
  }
  catch (error) {
    console.error('Failed to initialize CSRF cookie', error)
  }
}

const cookieToken = <T = string>(config: ModuleOptions): Readonly<CookieRef<T>> => {
  return useCookie(config.csrf.cookieName, { readonly: true })
}

/**
 * Attach the CSRF header to the request.
 */
const attachCsrfHeader = async (
  headers: HeadersInit | undefined,
  config: ModuleOptions,
): Promise<HeadersInit> => {
  let token = cookieToken(config)

  if (!token.value) {
    await fetchCsrfCookie(config)
    token = cookieToken(config)
  }

  if (!token.value) {
    console.warn(
      `Unable to set ${config.csrf.headerName} header`,
    )
    return headers ?? {}
  }

  return {
    ...headers,
    [config.csrf.headerName]: token.value,
  }
}

/**
 * Attach Referer and Origin headers.
 */
const attachServerHeaders = (
  headers: HeadersInit | undefined,
  config: ModuleOptions,
): HeadersInit => {
  const clientCookies = useRequestHeaders(['cookie'])

  const origin = config.originUrl ?? useRequestURL().origin

  return {
    ...headers,
    Referer: origin,
    Origin: origin,
    ...clientCookies,
  }
}

/**
 * Generate request payload.
 */
const generateRequestPayload = async (
  context: FetchContext,
  config: ModuleOptions,
): Promise<void> => {
  const method = context.options.method?.toLowerCase() ?? 'get'

  context.options.headers = new Headers({
    Accept: 'application/json',
    ...(context.options.headers instanceof Headers
      ? Object.fromEntries(context.options.headers.entries())
      : context.options.headers),
  })

  if (context.options.body instanceof FormData) {
    context.options.method = 'POST'
    context.options.body.append('_method', method.toUpperCase())
  }

  if (import.meta.server) {
    context.options.headers = new Headers(
      attachServerHeaders(
        Object.fromEntries(context.options.headers.entries()),
        config,
      ),
    )
  }

  if (['post', 'delete', 'put', 'patch'].includes(method)) {
    context.options.headers = new Headers(
      await attachCsrfHeader(
        Object.fromEntries(context.options.headers.entries()),
        config,
      ),
    )
  }
}

/**
 * Create and configure a new fetch service instance.
 */
export default (options?: FetchOptions): FetchOptions => {
  const config = useApiOptions()
  options ||= {}

  return {
    baseURL: config.apiBaseURL,
    credentials: getCredentials(),
    redirect: 'manual',
    retry: config.fetchOptions.retryAttempts,

    onRequest: async (context: FetchContext): Promise<void> => {
      if (options.onRequest) {
        if (Array.isArray(options.onRequest)) {
          for (const hook of options.onRequest) {
            await hook(context)
          }
        }
        else {
          await options.onRequest(context)
        }
      }

      await generateRequestPayload(context, config)
    },

    onResponseError: async (context): Promise<void> => {
      useErrorBag().handle(context)

      if (options.onResponseError) {
        if (Array.isArray(options.onResponseError)) {
          for (const hook of options.onResponseError) {
            await hook(context)
          }
        }
        else {
          await options.onResponseError(context)
        }
      }
    },
  }
}
