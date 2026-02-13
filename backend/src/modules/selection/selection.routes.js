const express = require('express')
const selectionController = require('./selection.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../utils/asyncHandler')
const AppError = require('../../utils/AppError')

const VALID_STAGES = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL']

const validateEmailArray = (fieldName) => asyncHandler(async (req, res, next) => {
  const emails = req.body[fieldName]
  if (!Array.isArray(emails) || emails.length === 0) {
    throw new AppError(`${fieldName} must be a non-empty array`, 400)
  }

  if (emails.some((email) => typeof email !== 'string' || !email.trim())) {
    throw new AppError(`${fieldName} must contain valid email strings`, 400)
  }

  next()
})

const validateCollegeIdBody = asyncHandler(async (req, res, next) => {
  if (!req.body.collegeId || typeof req.body.collegeId !== 'string') {
    throw new AppError('collegeId is required', 400)
  }
  next()
})

const validateRejectBody = asyncHandler(async (req, res, next) => {
  const { currentStage } = req.body
  if (!currentStage || !VALID_STAGES.includes(currentStage)) {
    throw new AppError('currentStage must be one of APPLICATIONS, TEST, SHORTLIST, INTERVIEW, FINAL', 400)
  }
  next()
})

const validatePagination = asyncHandler(async (req, res, next) => {
  const { page, limit } = req.query

  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) <= 0)) {
    throw new AppError('page must be a positive integer', 400)
  }

  if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) <= 0)) {
    throw new AppError('limit must be a positive integer', 400)
  }

  next()
})

const router = express.Router()

router.use(authenticate)

router.post(
  '/:driveId/shortlist',
  requireRole('COLLEGE', 'ADMIN'),
  validateCollegeIdBody,
  validateEmailArray('studentEmails'),
  selectionController.uploadShortlist
)

router.post(
  '/:driveId/interview',
  requireRole('COLLEGE', 'ADMIN'),
  validateCollegeIdBody,
  validateEmailArray('studentEmails'),
  selectionController.uploadInterviewList
)

router.post(
  '/:driveId/finalize',
  requireRole('COLLEGE', 'COMPANY', 'ADMIN'),
  validateCollegeIdBody,
  validateEmailArray('studentEmails'),
  selectionController.finalizeSelections
)

router.post(
  '/:driveId/reject',
  requireRole('COMPANY', 'ADMIN'),
  validateCollegeIdBody,
  validateEmailArray('studentEmails'),
  validateRejectBody,
  selectionController.bulkRejectApplications
)

router.get(
  '/:driveId/shortlisted',
  requireRole('COLLEGE', 'COMPANY', 'ADMIN'),
  validatePagination,
  selectionController.getShortlistedApplications
)

router.get(
  '/:driveId/interview',
  requireRole('COLLEGE', 'COMPANY', 'ADMIN'),
  validatePagination,
  selectionController.getInterviewApplications
)

router.get(
  '/:driveId/final',
  requireRole('COLLEGE', 'COMPANY', 'ADMIN'),
  validatePagination,
  selectionController.getFinalSelections
)

router.get(
  '/:driveId/stats',
  requireRole('COLLEGE', 'COMPANY', 'ADMIN'),
  selectionController.getSelectionStats
)

router.post(
  '/:driveId/validate-emails',
  requireRole('COLLEGE', 'ADMIN'),
  validateCollegeIdBody,
  validateEmailArray('emails'),
  selectionController.validateEmailsAgainstStudents
)

router.post(
  '/:driveId/close',
  requireRole('COLLEGE', 'ADMIN'),
  validateCollegeIdBody,
  selectionController.closeCollegeDrive
)

module.exports = router
