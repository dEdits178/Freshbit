import api from './api'

const unwrap = (response) => response?.data?.data ?? response?.data

export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password })
  return unwrap(response)
}

export const register = async (data) => {
  const response = await api.post('/api/auth/register', data)
  const registered = unwrap(response)

  try {
    const loginResult = await login(data.email, data.password)
    return {
      ...loginResult,
      justRegistered: true,
      verificationRequired: !loginResult?.user?.emailVerified
    }
  } catch (error) {
    return {
      user: registered,
      verificationRequired: true,
      justRegistered: true
    }
  }
}

export const logout = async () => {
  try {
    await api.post('/api/auth/logout')
  } catch {
    // no-op: logout should clear client state regardless
  }
}

export const refreshAccessToken = async () => {
  const response = await api.post('/api/auth/refresh')
  const payload = unwrap(response)
  return payload?.accessToken
}

export const requestPasswordReset = async (email) => {
  const response = await api.post('/api/auth/forgot-password', { email })
  return unwrap(response)
}

export const resetPassword = async (token, password) => {
  const response = await api.post('/api/auth/reset-password', {
    token,
    newPassword: password
  })
  return unwrap(response)
}

export const verifyEmail = async (token) => {
  const response = await api.post('/api/auth/verify-email', { token })
  return unwrap(response)
}

export const changePassword = async (oldPassword, newPassword) => {
  const response = await api.post('/api/auth/change-password', {
    oldPassword,
    newPassword
  })
  return unwrap(response)
}

export const updateProfile = async (data) => {
  const response = await api.put('/api/auth/profile', data)
  return unwrap(response)
}

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me')
  return unwrap(response)
}
