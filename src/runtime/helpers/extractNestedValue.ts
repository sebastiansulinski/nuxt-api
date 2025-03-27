export default <T>(
  response: undefined,
  wrapperKey: string | null,
): T | null => {
  if (!wrapperKey) return response as T

  return wrapperKey
    .split('.')
    .reduce((accumulator, key: string) => accumulator && accumulator[key], response) as T
}
