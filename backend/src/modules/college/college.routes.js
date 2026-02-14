const express = require('express')
const collegeController = require('./college.controller')
const { validateUpdateProfile, validateDriveId } = require('./college.validation')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../utils/asyncHandler')
const multer = require('multer')

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

// All routes require authentication and COLLEGE role
router.use(authenticate)
router.use(requireRole('COLLEGE'))

// Dashboard stats
router.get('/stats', collegeController.getStats)

// Profile management
router.get('/profile', collegeController.getProfile)
router.patch('/profile', asyncHandler(async (req, res, next) => {
  validateUpdateProfile(req.body)
  next()
}), collegeController.updateProfile)

// Invitations
router.get('/invitations', collegeController.getInvitations)
router.post('/invitations/:invitationId/accept', collegeController.acceptInvitation)
router.post('/invitations/:invitationId/reject', collegeController.rejectInvitation)

// View assigned drives
router.get('/drives', collegeController.getAssignedDrives)
router.get('/drives/:driveId', asyncHandler(async (req, res, next) => {
  validateDriveId(req.params.driveId)
  next()
}), collegeController.getDriveDetails)

// Student management
router.post('/drives/:driveId/upload-students', upload.single('file'), collegeController.uploadStudents)
router.post('/drives/:driveId/confirm-students', collegeController.confirmStudents)
router.get('/drives/:driveId/students', collegeController.getStudents)
router.delete('/drives/:driveId/students/:studentId', collegeController.deleteStudent)
router.get('/drives/:driveId/students/export', collegeController.exportStudents)

// Templates
router.get('/template/students', collegeController.downloadTemplate)

module.exports = router
