import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

let accessTokenGetter = () => null

export const setAccessTokenGetter = (getter) => {
  accessTokenGetter = getter
}

export const api = axios.create({
  baseURL,
  withCredentials: true
})

api.interceptors.request.use(
  (config) => {
    const token = accessTokenGetter?.()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.withCredentials = true
    return config
  },
  (error) => Promise.reject(error)
)

export default api
