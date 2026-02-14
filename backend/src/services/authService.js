const prisma = require('../../prisma/client')
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/jwt')
const {
  hashPassword,
  comparePassword,
  validatePasswordStrength
} = require('../utils/password')

const parseDurationToMs = (value, fallbackMs) => {
  if (!value) return fallbackMs

  const match = String(value).trim().match(/^(\d+)([smhd])$/i)
  if (!match) return fallbackMs

  const amount = Number(match[1])
  const unit = match[2].toLowerCase()

  const unitMap = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  }

  return amount * unitMap[unit]
}

const sanitizeUser = (user) => {
  if (!user) return null

  const { password, ...safeUser } = user
  return safeUser
}

class AuthService {
  async register({ name, email, password, role, organizationName }) {
    const allowedRoles = ['ADMIN', 'COMPANY', 'COLLEGE']
    if (!allowedRoles.includes(role)) {
      const error = new Error('Invalid role')
      error.statusCode = 400
      throw error
    }

    if (role === 'COLLEGE' && !organizationName) {
      const error = new Error('organizationName is required for COLLEGE role')
      error.statusCode = 400
      throw error
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      const error = new Error('Email already exists')
      error.statusCode = 400
      throw error
    }

    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.valid) {
      const error = new Error(passwordCheck.message)
      error.statusCode = 400
      throw error
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        status: 'APPROVED',
        verified: true
      }
    })

    if (role === 'COMPANY') {
      const domain = (email.split('@')[1] || 'example.com').toLowerCase()
      await prisma.company.create({
        data: {
          userId: user.id,
          name: organizationName || name || 'Company',
          domain,
          approved: true
        }
      })
    }

    if (role === 'COLLEGE') {
      await prisma.college.create({
        data: {
          userId: user.id,
          name: organizationName || name || 'College',
          city: 'Unknown',
          state: 'Unknown',
          tier: 'A',
          approved: true
        }
      })
    }

    return sanitizeUser(user)
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      const error = new Error('Invalid credentials')
      error.statusCode = 401
      throw error
    }

    if (!user.verified) {
      const error = new Error('Account not verified')
      error.statusCode = 403
      throw error
    }

    if (user.status !== 'APPROVED') {
      const error = new Error('Account not approved')
      error.statusCode = 403
      throw error
    }

    const matches = await comparePassword(password, user.password)
    if (!matches) {
      const error = new Error('Invalid credentials')
      error.statusCode = 401
      throw error
    }

    const accessToken = generateAccessToken(user.id, user.role)
    const refreshToken = generateRefreshToken(user.id)

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    }
  }

  async refreshAccessToken(refreshToken) {
    const payload = verifyRefreshToken(refreshToken)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })

    if (!user || !user.verified || user.status !== 'APPROVED') {
      const error = new Error('Token invalid')
      error.statusCode = 401
      throw error
    }

    return generateAccessToken(user.id, user.role)
  }

  async logout() {
    return
  }

  async requestPasswordReset() {
    return
  }

  async resetPassword(_token, newPassword) {
    const passwordCheck = validatePasswordStrength(newPassword)
    if (!passwordCheck.valid) {
      const error = new Error(passwordCheck.message)
      error.statusCode = 400
      throw error
    }

    const error = new Error('Password reset flow is disabled in local dummy mode')
    error.statusCode = 400
    throw error
  }

  async verifyEmail() {
    return
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      const error = new Error('User not found')
      error.statusCode = 404
      throw error
    }

    const oldMatches = await comparePassword(oldPassword, user.password)
    if (!oldMatches) {
      const error = new Error('Invalid credentials')
      error.statusCode = 401
      throw error
    }

    const passwordCheck = validatePasswordStrength(newPassword)
    if (!passwordCheck.valid) {
      const error = new Error(passwordCheck.message)
      error.statusCode = 400
      throw error
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })
  }

  async updateProfile(userId, { name, organizationName }) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      const error = new Error('User not found')
      error.statusCode = 404
      throw error
    }

    if (user.role === 'COMPANY' && typeof name === 'string' && name.trim()) {
      await prisma.company.update({
        where: { userId },
        data: { name: name.trim() }
      }).catch(() => null)
    }

    if (user.role === 'COLLEGE') {
      const nextName = (organizationName || name || '').trim()
      if (nextName) {
        await prisma.college.update({
          where: { userId },
          data: { name: nextName }
        }).catch(() => null)
      }
    }

    return sanitizeUser(user)
  }

  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      const error = new Error('User not found')
      error.statusCode = 404
      throw error
    }
    return sanitizeUser(user)
  }
}

module.exports = new AuthService()
