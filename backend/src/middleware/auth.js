const prisma = require('../../prisma/client')
const { verifyAccessToken } = require('../utils/jwt')

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      const error = new Error('Authentication token is required')
      error.statusCode = 401
      throw error
    }

    const payload = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        organizationName: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      }
    })

    if (!user || !user.isActive) {
      const error = new Error('User not found')
      error.statusCode = 404
      throw error
    }

    req.user = user
    next()
  } catch (error) {
    if (!error.statusCode) {
      if (error.name === 'TokenExpiredError') {
        error.statusCode = 401
        error.message = 'Token expired'
      } else if (error.name === 'JsonWebTokenError') {
        error.statusCode = 401
        error.message = 'Token invalid'
      }
    }
    next(error)
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Authentication required')
      error.statusCode = 401
      return next(error)
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error('Forbidden')
      error.statusCode = 403
      return next(error)
    }

    next()
  }
}

module.exports = {
  authenticate,
  authorize
}
