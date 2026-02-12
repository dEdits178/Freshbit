const express = require('express')
const applicationController = require('./application.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')

const router = express.Router()

// POST /applications/:driveId/create - Create applications for students
// Auth: COLLEGE, ADMIN
router.post(
  '/:driveId/create',
  authenticate,
  requireRole('COLLEGE', 'ADMIN'),
  applicationController.createApplications
)

// GET /applications/drive/:driveId - Get applications for a drive
// Auth: COMPANY, ADMIN
router.get(
  '/drive/:driveId',
  authenticate,
  requireRole('COMPANY', 'ADMIN'),
  applicationController.getApplicationsByDrive
)

// GET /applications/college/:driveId/:collegeId - Get applications for a specific college in a drive
// Auth: COLLEGE, COMPANY, ADMIN
router.get(
  '/college/:driveId/:collegeId',
  authenticate,
  requireRole('COLLEGE', 'COMPANY', 'ADMIN'),
  applicationController.getApplicationsByCollege
)

// GET /applications/stats/:driveId - Get application statistics for a drive
// Auth: COMPANY, ADMIN
router.get(
  '/stats/:driveId',
  authenticate,
  requireRole('COMPANY', 'ADMIN'),
  applicationController.getApplicationStats
)

// PATCH /applications/:applicationId/status - Update application status
// Auth: COMPANY, ADMIN
router.patch(
  '/:applicationId/status',
  authenticate,
  requireRole('COMPANY', 'ADMIN'),
  applicationController.updateApplicationStatus
)

module.exports = router
