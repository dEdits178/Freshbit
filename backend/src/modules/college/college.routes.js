const express = require('express')
const collegeController = require('./college.controller')
const { validateUpdateProfile, validateDriveId } = require('./college.validation')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../../utils/asyncHandler')

const router = express.Router()

// All routes require authentication and COLLEGE role
router.use(authenticate)
router.use(requireRole('COLLEGE'))

// Profile management
router.get('/profile', collegeController.getProfile)
router.patch('/profile', asyncHandler(async (req, res, next) => {
  validateUpdateProfile(req.body)
  next()
}), collegeController.updateProfile)

// View assigned drives
router.get('/drives', collegeController.getAssignedDrives)
router.get('/drives/:driveId', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  next()
}), collegeController.getDriveDetails)

module.exports = router
