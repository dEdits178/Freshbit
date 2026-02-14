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
        email: true,
        role: true,
        status: true,
        verified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user || user.status !== 'APPROVED') {
      const error = new Error('User not found or not approved')
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
    console.log('🔐 Authorization Check:');
    console.log('   Required roles:', roles);
    console.log('   User exists:', !!req.user);
    console.log('   User role:', req.user?.role);
    console.log('   Roles includes user role:', roles.includes(req.user?.role));

    if (!req.user) {
      const error = new Error('Authentication required')
      error.statusCode = 401
      return next(error)
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Authorization FAILED - role mismatch');
      const error = new Error('Forbidden')
      error.statusCode = 403
      return next(error)
    }

    console.log('✅ Authorization SUCCESS');
    next()
  }
}

module.exports = {
  authenticate,
  authorize
}
