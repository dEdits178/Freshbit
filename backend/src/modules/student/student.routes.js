const express = require('express')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../../utils/asyncHandler')
const AppError = require('../../utils/AppError')
const studentController = require('./student.controller')

const router = express.Router()

router.use(authenticate)

const validateConfirmBody = asyncHandler(async (req, res, next) => {
  const { students } = req.body
  if (!Array.isArray(students) || students.length === 0) {
    throw new AppError('students must be a non-empty array', 400)
  }
  next()
})

router.post('/:driveId/confirm',
  requireRole('COLLEGE', 'ADMIN'),
  validateConfirmBody,
  studentController.confirm
)

module.exports = router
