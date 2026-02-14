export const attachTokenRefreshInterceptor = ({
  api,
  refreshToken,
  setAccessToken,
  logout,
  navigateToLogin
}) => {
  let isRefreshing = false
  let queue = []

  const processQueue = (error, token = null) => {
    queue.forEach(({ resolve, reject }) => {
      if (error) reject(error)
      else resolve(token)
    })
    queue = []
  }

  const interceptorId = api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config
      const status = error?.response?.status
      const requestUrl = originalRequest?.url || ''

      const skipRefresh = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/auth/verify-email',
        '/api/auth/logout'
      ].some((path) => requestUrl.includes(path))

      if (!originalRequest || status !== 401 || originalRequest._retry || skipRefresh) {
        return Promise.reject(error)
      }

      if (originalRequest.url?.includes('/api/auth/refresh')) {
        await logout()
        navigateToLogin?.()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshToken()
        if (!newToken) throw new Error('No token returned from refresh endpoint')

        setAccessToken(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        await logout()
        navigateToLogin?.()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
  )

  return () => api.interceptors.response.eject(interceptorId)
}
