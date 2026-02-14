const express = require('express')
const rateLimit = require('express-rate-limit')

const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const {
  validateRegister,
  validateLogin,
  validatePasswordReset,
  validateEmailVerification,
  validateChangePassword,
  handleValidation
} = require('../middleware/validation')

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth requests, please try again later.',
    data: null,
    errors: null
  }
})

// Public routes
router.post('/register', authLimiter, validateRegister, (req, res, next) => authController.register(req, res, next))
router.post('/login', authLimiter, validateLogin, (req, res, next) => authController.login(req, res, next))
router.post('/refresh', authLimiter, (req, res, next) => authController.refresh(req, res, next))
router.post('/logout', authLimiter, (req, res, next) => authController.logout(req, res, next))

router.post(
  '/forgot-password',
  authLimiter,
  validatePasswordReset,
  (req, res, next) => authController.forgotPassword(req, res, next)
)

router.post(
  '/reset-password',
  authLimiter,
  validatePasswordReset,
  (req, res, next) => authController.resetPassword(req, res, next)
)

router.post(
  '/verify-email',
  authLimiter,
  validateEmailVerification,
  (req, res, next) => authController.verifyEmail(req, res, next)
)

// Protected routes
router.post(
  '/change-password',
  authLimiter,
  authenticate,
  validateChangePassword,
  (req, res, next) => authController.changePassword(req, res, next)
)

router.put('/profile', authLimiter, authenticate, handleValidation, (req, res, next) =>
  authController.updateProfile(req, res, next)
)

router.get('/me', authLimiter, authenticate, (req, res, next) => authController.me(req, res, next))

module.exports = router
