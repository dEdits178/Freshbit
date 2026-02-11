const express = require('express')
const authController = require('./auth.controller')
const { validateCompanyRegistration, validateCollegeRegistration, validateLogin } = require('./auth.validation')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../../utils/asyncHandler')

const router = express.Router()

router.post('/register/company', asyncHandler(async (req, res, next) => {
  validateCompanyRegistration(req.body)
  next()
}), authController.registerCompany)

router.post('/register/college', asyncHandler(async (req, res, next) => {
  validateCollegeRegistration(req.body)
  next()
}), authController.registerCollege)

router.post('/login', asyncHandler(async (req, res, next) => {
  validateLogin(req.body)
  next()
}), authController.login)

router.patch('/admin/approve/:userId', authenticate, requireRole('ADMIN'), authController.approveUser)

module.exports = router
