const express = require('express')
const driveController = require('./drive.controller')
const { validateCreateDrive, validateDriveId, validateCollegeResponse, validateAdminOverride } = require('./drive.validation')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../../utils/asyncHandler')

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// COMPANY ROUTES
const companyRouter = express.Router()
companyRouter.use(requireRole('COMPANY'))

// Create drive
companyRouter.post('/', asyncHandler(async (req, res, next) => {
  validateCreateDrive(req.body)
  next()
}), driveController.createDrive)

// Get all company drives
companyRouter.get('/', driveController.getCompanyDrives)

// Get specific drive
companyRouter.get('/:driveId', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  next()
}), driveController.getDriveById)

// Publish drive
companyRouter.patch('/:driveId/publish', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  next()
}), driveController.publishDrive)

// COLLEGE ROUTES
const collegeRouter = express.Router()
collegeRouter.use(requireRole('COLLEGE'))

// Respond to drive invitation
collegeRouter.patch('/:driveId/respond', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateCollegeResponse(req.body)
  next()
}), driveController.respondToDrive)

// ADMIN ROUTES
const adminRouter = express.Router()
adminRouter.use(requireRole('ADMIN'))

// Admin override for drive invitations
adminRouter.patch('/:driveId/colleges/:collegeId/override', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateAdminOverride(req.body)
  next()
}), driveController.adminOverrideDrive)

// Mount role-specific routes
router.use('/company', companyRouter)
router.use('/college', collegeRouter)
router.use('/admin', adminRouter)

module.exports = router
