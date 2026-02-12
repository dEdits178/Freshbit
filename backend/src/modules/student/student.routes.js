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
  
  // Validate each student
  for (const student of students) {
    if (!student.firstName || typeof student.firstName !== 'string' || student.firstName.trim() === '') {
      throw new AppError('Student firstName is required and must be non-empty', 400)
    }
    
    if (!student.lastName || typeof student.lastName !== 'string' || student.lastName.trim() === '') {
      throw new AppError('Student lastName is required and must be non-empty', 400)
    }
    
    if (!student.email || typeof student.email !== 'string' || student.email.trim() === '') {
      throw new AppError('Student email is required and must be non-empty', 400)
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(student.email)) {
      throw new AppError(`Invalid email format: ${student.email}`, 400)
    }
  }
  
  next()
})

router.post('/:driveId/confirm',
  requireRole('COLLEGE', 'ADMIN'),
  validateConfirmBody,
  studentController.confirm
)

module.exports = router
