const { Prisma } = require('@prisma/client')
const { error } = require('../utils/response')

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'
  let details = err.errors || null

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 400
      message = 'Duplicate entry. Resource already exists.'
    } else if (err.code === 'P2025') {
      statusCode = 404
      message = 'User not found'
    } else {
      statusCode = 400
      message = 'Database request error'
    }
  }

  // Prisma validation/runtime errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400
    message = 'Database validation error'
  }

  // JWT errors
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Token invalid'
  }

  // express-validator errors (custom mapped)
  if (message === 'Validation errors' && !details) {
    details = [{ message: 'Invalid request payload' }]
    statusCode = 400
  }

  return error(res, message, statusCode, details)
}

module.exports = errorHandler
