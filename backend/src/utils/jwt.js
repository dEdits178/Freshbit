const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m'
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'

const getJwtSecret = () => {
  if (!JWT_SECRET) {
    const error = new Error('JWT_SECRET is required in environment variables')
    error.statusCode = 500
    throw error
  }
  return JWT_SECRET
}

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: ACCESS_EXPIRY })
}

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, getJwtSecret(), { expiresIn: REFRESH_EXPIRY })
}

const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret())

const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, getJwtSecret())
  if (payload.type !== 'refresh') {
    const err = new Error('Invalid refresh token type')
    err.name = 'JsonWebTokenError'
    throw err
  }
  return payload
}

const generateResetToken = () => crypto.randomBytes(32).toString('hex')

const generateVerificationToken = () => crypto.randomBytes(32).toString('hex')

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
  generateVerificationToken,
  // Backward-compatible aliases for older modules.
  generateToken: (payload) => jwt.sign(payload, getJwtSecret(), { expiresIn: REFRESH_EXPIRY }),
  verifyToken: verifyAccessToken
}
