const express = require('express')
const driveController = require('./drive.controller')
const { validateCreateDrive, validateDriveId, validateCollegeResponse, validateAdminOverride } = require('./drive.validation')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../../utils/asyncHandler')
const studentController = require('../student/student.controller')
const { validateBulkUpload } = require('../student/student.validation')
const applicationController = require('../application/application.controller')
const { validateStageParam, validateShortlistBody, validateFinalizeBody } = require('../application/application.validation')

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

// View applications by drive (grouped by college)
companyRouter.get('/:driveId/applications', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  next()
}), applicationController.getDriveApplications)

// COLLEGE ROUTES
const collegeRouter = express.Router()
collegeRouter.use(requireRole('COLLEGE'))

// Respond to drive invitation
collegeRouter.patch('/:driveId/respond', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateCollegeResponse(req.body)
  next()
}), driveController.respondToDrive)

// Student bulk upload
collegeRouter.post('/:driveId/students/upload', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateBulkUpload(req.body)
  next()
}), studentController.bulkUpload)

// Stage progression
collegeRouter.patch('/:driveId/stages/:stage/move', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateStageParam(req.params.stage)
  next()
}), applicationController.moveStageCollege)

// Shortlist upload
collegeRouter.post('/:driveId/shortlist', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateShortlistBody(req.body)
  next()
}), applicationController.uploadShortlistCollege)

// Final selection
collegeRouter.post('/:driveId/finalize', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateFinalizeBody(req.body)
  next()
}), applicationController.finalizeCollege)

// ADMIN ROUTES
const adminRouter = express.Router()
adminRouter.use(requireRole('ADMIN'))

// Admin override for drive invitations
adminRouter.patch('/:driveId/colleges/:collegeId/override', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateAdminOverride(req.body)
  next()
}), driveController.adminOverrideDrive)

// Admin bulk upload (managedBy must be ADMIN)
adminRouter.post('/:driveId/colleges/:collegeId/students/upload', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateBulkUpload(req.body)
  next()
}), studentController.adminBulkUpload)

// Admin stage progression
adminRouter.patch('/:driveId/colleges/:collegeId/stages/:stage/move', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateStageParam(req.params.stage)
  next()
}), applicationController.moveStageAdmin)

// Admin shortlist upload
adminRouter.post('/:driveId/colleges/:collegeId/shortlist', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateShortlistBody(req.body)
  next()
}), applicationController.uploadShortlistAdmin)

// Admin final selection
adminRouter.post('/:driveId/colleges/:collegeId/finalize', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  validateFinalizeBody(req.body)
  next()
}), applicationController.finalizeAdmin)

// Mount role-specific routes
router.use('/company', companyRouter)
router.use('/college', collegeRouter)
router.use('/admin', adminRouter)

module.exports = router
