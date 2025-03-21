import { useApiOptions } from '../composables/useApiOptions'
import { useApiFetch } from '../composables/useApiFetch'

export async function getAuthUser<T = unknown>(): Promise<T | null> {
  const options = useApiOptions()
  const responseWrapper = options.userResponseKey || null

  const response = await useApiFetch(options.endpoints.user)

  return responseWrapper
    ? responseWrapper
      .split('.')
      .reduce((retain, key) => retain && retain[key], response) as T
    : response
}
