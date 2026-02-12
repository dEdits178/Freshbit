const express = require('express')
const stageController = require('./stage.controller')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../utils/asyncHandler')
const AppError = require('../../utils/AppError')

const VALID_STAGES = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL']

const validateIdArray = (fieldName) => asyncHandler(async (req, res, next) => {
  const ids = req.body[fieldName]
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError(`${fieldName} must be a non-empty array`, 400)
  }
  if (ids.some(id => typeof id !== 'string' || !id.trim())) {
    throw new AppError(`${fieldName} must contain valid string ids`, 400)
  }
  next()
})

const validateProgressBody = asyncHandler(async (req, res, next) => {
  const { collegeId, applicationIds, targetStage } = req.body
  if (!collegeId || typeof collegeId !== 'string') {
    throw new AppError('collegeId is required', 400)
  }
  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    throw new AppError('applicationIds must be a non-empty array', 400)
  }
  if (!VALID_STAGES.includes(targetStage)) {
    throw new AppError('Invalid targetStage', 400)
  }
  next()
})

const validateStageParam = asyncHandler(async (req, res, next) => {
  const { stage } = req.params
  if (!VALID_STAGES.includes(stage)) {
    throw new AppError('Invalid stage parameter', 400)
  }
  next()
})

const router = express.Router()

router.use(authenticate)

router.post('/drive/:driveId/initialize', requireRole('COMPANY'), stageController.initializeDriveStages)
router.post('/drive/:driveId/next', requireRole('COMPANY', 'ADMIN'), stageController.activateNextStage)
router.post('/drive/:driveId/progress', requireRole('COLLEGE', 'ADMIN'), validateProgressBody, stageController.progressApplicationsToStage)
router.post('/drive/:driveId/reject', requireRole('COMPANY', 'ADMIN'), validateIdArray('applicationIds'), stageController.rejectApplications)
router.post('/drive/:driveId/complete', requireRole('COMPANY', 'ADMIN', 'COLLEGE'), stageController.completeCurrentStage)
router.get('/drive/:driveId/progress', requireRole('COMPANY', 'COLLEGE', 'ADMIN'), stageController.getDriveStageProgress)
router.get('/drive/:driveId/applications/:stage', requireRole('COMPANY', 'COLLEGE', 'ADMIN'), validateStageParam, stageController.getApplicationsByStage)

module.exports = router
