export interface ModuleOptions {
  /**
   * The base URL of the API server.
   * @example http://localhost:8000
   */
  apiBaseURL: string

  /**
   * The current application base URL for the Referrer and Origin header.
   * @example 'http://localhost:3000'
   */
  originUrl?: string

  /**
   * The key to use to store the authenticated user in the `useState` variable.
   */
  userStateKey: string

  /**
   * Defines the key used to extract user data from the `endpoints.user` API response.
   *
   * Example usage: for response `{ user: { ... } }` it would be `user`
   */
  userResponseKey?: null | string

  /**
   * Fetch options.
   */
  fetchOptions: {
    /**
     * The number of times to retry a request when it fails.
     */
    retryAttempts: number | false
  }

  /**
   * CSRF token options.
   */
  csrf: {
    /**
     * Name of the CSRF cookie to extract from server response.
     */
    cookieName: string

    /**
     * Name of the CSRF header to pass from client to server.
     */
    headerName: string
  }

  /**
   * API endpoints.
   */
  endpoints: {
    /**
     * The endpoint to obtain a new CSRF token.
     */
    csrf: string

    /**
     * The authentication endpoint.
     */
    login: string

    /**
     * The logout endpoint.
     */
    logout: string

    /**
     * The endpoint to fetch current user data.
     */
    user: string
  }

  /**
   * Redirect specific settings.
   */
  redirect: {
    /**
     * Specifies whether to retain the requested route when redirecting after login.
     */
    intendedEnabled: boolean

    /**
     * Redirect path when access requires user authentication.
     * Throws a 403 error if set to false.
     */
    login: string | false

    /**
     * Redirect path for unauthenticated users.
     * Throws a 403 error if set to false.
     */
    guest: string | false

    /**
     * Redirect path after a successful login.
     * No redirection if set to false.
     */
    postLogin: string | false

    /**
     * Redirect path after a logout.
     * No redirection if set to false.
     */
    postLogout: string | false
  }

  middlewareNames: {
    /**
     * Middleware name for authenticated users.
     */
    auth: string

    /**
     * Middleware name for guest users.
     */
    guest: string
  }
}
