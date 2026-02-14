const express = require('express')
const companyCollegeController = require('./companyCollege.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../utils/asyncHandler')

const router = express.Router()

// All routes require authentication and COMPANY role
router.use(authenticate)
router.use(requireRole('COMPANY'))

// Get all approved colleges (for browsing/inviting)
router.get('/colleges', asyncHandler(companyCollegeController.getColleges))

// Get invited colleges for a specific drive
router.get('/drives/:driveId/colleges', asyncHandler(companyCollegeController.getDriveColleges))

// Get specific college details within a drive
router.get('/drives/:driveId/colleges/:collegeId', asyncHandler(companyCollegeController.getDriveCollegeById))

// Invite colleges to a drive
router.post('/drives/:driveId/invite', asyncHandler(companyCollegeController.inviteColleges))

// Update college invitation status in a drive (admin override)
router.patch('/drives/:driveId/colleges/:collegeId/status', asyncHandler(companyCollegeController.updateCollegeStatus))

// Get selections for a drive (optionally filtered by collegeId)
router.get('/drives/:driveId/selections', asyncHandler(companyCollegeController.getSelections))

// Get stage progress for a specific college in a drive
router.get('/drives/:driveId/colleges/:collegeId/stages', asyncHandler(companyCollegeController.getCollegeStageProgress))

// Get upload logs for a specific college in a drive
router.get('/drives/:driveId/colleges/:collegeId/uploads', asyncHandler(companyCollegeController.getCollegeUploads))

module.exports = router
