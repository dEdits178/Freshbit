import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setAccessTokenGetter } from '../services/api'
import * as authService from '../services/authService'
import { attachTokenRefreshInterceptor } from '../utils/tokenRefresh'

const AuthContext = createContext(null)

const roleRedirectPath = (role) => {
  if (role === 'ADMIN') return '/admin'
  if (role === 'COMPANY') return '/company'
  if (role === 'COLLEGE') return '/college'
  return '/login'
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = Boolean(user && accessToken)

  const hardLogout = async () => {
    setUser(null)
    setAccessToken(null)
  }

  const refreshToken = async () => {
    const token = await authService.refreshAccessToken()
    if (token) setAccessToken(token)
    return token
  }

  const login = async (email, password) => {
    const payload = await authService.login(email, password)
    setUser(payload.user)
    setAccessToken(payload.accessToken)
    return payload.user
  }

  const register = async (data) => {
    const payload = await authService.register(data)
    if (payload?.accessToken && payload?.user) {
      setUser(payload.user)
      setAccessToken(payload.accessToken)
    }
    return payload
  }

  const logout = async () => {
    await authService.logout()
    await hardLogout()
    navigate('/login')
  }

  const updateProfile = async (data) => {
    const updatedUser = await authService.updateProfile(data)
    setUser(updatedUser)
    return updatedUser
  }

  const changePassword = async (oldPassword, newPassword) => {
    await authService.changePassword(oldPassword, newPassword)
    await logout()
  }

  useEffect(() => {
    setAccessTokenGetter(() => accessToken)
  }, [accessToken])

  useEffect(() => {
    const detach = attachTokenRefreshInterceptor({
      api,
      refreshToken,
      setAccessToken,
      logout: hardLogout,
      navigateToLogin: () => navigate('/login')
    })

    return () => detach()
  }, [navigate])

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const existingUser = await authService.getCurrentUser()
        setUser(existingUser)
      } catch {
        try {
          const token = await authService.refreshAccessToken()
          if (token) {
            setAccessToken(token)
            const existingUser = await authService.getCurrentUser()
            setUser(existingUser)
          }
        } catch {
          await hardLogout()
        }
      } finally {
        setLoading(false)
      }
    }

    bootstrapAuth()
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshToken,
      updateProfile,
      changePassword,
      setAccessToken,
      roleRedirectPath
    }),
    [user, accessToken, loading, isAuthenticated]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
