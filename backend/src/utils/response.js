const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null
  })
}

const error = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors
  })
}

// Backward-compatible aliases for older modules in this codebase.
const successResponse = (res, statusCode, message, data = null) => success(res, data, message, statusCode)
const errorResponse = (res, statusCode, message, errors = null) => error(res, message, statusCode, errors)

module.exports = {
  success,
  error,
  successResponse,
  errorResponse
}
