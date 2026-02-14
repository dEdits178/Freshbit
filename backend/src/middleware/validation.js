const { body, validationResult } = require('express-validator')

const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation errors')
    error.statusCode = 400
    error.errors = errors.array().map((e) => ({
      field: e.path,
      message: e.msg
    }))
    return next(error)
  }
  return next()
}

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['ADMIN', 'COMPANY', 'COLLEGE']).withMessage('Role must be one of ADMIN, COMPANY, COLLEGE'),
  body('organizationName')
    .optional({ values: 'falsy' })
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('organizationName must be between 2 and 100 characters'),
  handleValidation
]

const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
  handleValidation
]

const validatePasswordReset = [
  body('token').optional().isString().withMessage('Token must be a string'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('newPassword')
    .optional()
    .isString()
    .isLength({ min: 6 })
    .withMessage('newPassword must be at least 6 characters long'),
  handleValidation
]

const validateEmailVerification = [
  body('token').isString().notEmpty().withMessage('Verification token is required'),
  handleValidation
]

const validateChangePassword = [
  body('oldPassword').isString().notEmpty().withMessage('oldPassword is required'),
  body('newPassword').isString().isLength({ min: 6 }).withMessage('newPassword must be at least 6 characters long'),
  handleValidation
]

module.exports = {
  validateRegister,
  validateLogin,
  validatePasswordReset,
  validateEmailVerification,
  validateChangePassword,
  handleValidation
}
