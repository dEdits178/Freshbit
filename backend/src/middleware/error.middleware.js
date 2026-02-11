const logger = require('../../config/logger')
const { errorResponse } = require('../utils/response')

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  if (err.code === 'P2002') {
    statusCode = 400
    message = 'Duplicate entry. Resource already exists.'
  }

  if (err.code === 'P2025') {
    statusCode = 404
    message = 'Resource not found'
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path
  })

  errorResponse(res, statusCode, message, process.env.NODE_ENV === 'development' ? err.stack : null)
}

module.exports = errorHandler
