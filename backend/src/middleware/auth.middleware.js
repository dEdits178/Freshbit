const { verifyToken } = require('../utils/jwt')
const prisma = require('../../prisma/client')
const AppError = require('../utils/AppError')
const asyncHandler = require('../../utils/asyncHandler')

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401)
  }

  const token = authHeader.split(' ')[1]

  let decoded
  try {
    decoded = verifyToken(token)
  } catch (error) {
    throw new AppError('Invalid or expired token', 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      verified: true
    }
  })

  if (!user) {
    throw new AppError('User not found', 401)
  }

  if (!user.verified || user.status !== 'APPROVED') {
    throw new AppError('User account is not active', 403)
  }

  req.user = user

  next()
})

module.exports = {
  authenticate
}
