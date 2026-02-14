const stageService = require('./stage.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../utils/asyncHandler')

class StageController {
  initializeDriveStages = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const stages = await stageService.initializeDriveStages({ driveId })
    successResponse(res, 201, 'Drive stages initialized successfully', { stages })
  })

  activateNextStage = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const result = await stageService.activateNextStage({ driveId, currentUser: req.user })
    const message = `Stage ${result.nextStage.name} activated successfully`
    successResponse(res, 200, message, {
      currentStage: {
        name: result.nextStage.name,
        status: result.nextStage.status,
        order: result.nextStage.order,
        startedAt: result.nextStage.startedAt
      },
      previousStage: {
        name: result.currentStage.name,
        status: 'COMPLETED'
      },
      drive: {
        id: result.drive.id,
        currentStage: result.drive.currentStage
      }
    })
  })

  progressApplicationsToStage = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId, applicationIds, targetStage } = req.body

    const result = await stageService.progressApplicationsToStage({
      driveId,
      collegeId,
      applicationIds,
      targetStage,
      currentUser: req.user
    })

    successResponse(res, 200, `${result.updated} applications progressed to ${targetStage}`, {
      updated: result.updated,
      targetStage
    })
  })

  rejectApplications = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { applicationIds } = req.body

    const result = await stageService.rejectApplications({
      driveId,
      applicationIds,
      currentUser: req.user
    })

    successResponse(res, 200, `${result.rejected} application(s) rejected`, result)
  })

  completeCurrentStage = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const result = await stageService.completeCurrentStage({
      driveId,
      currentUser: req.user
    })

    successResponse(res, 200, `Stage ${result.stage.name} completed successfully`, {
      stage: {
        name: result.stage.name,
        status: result.stage.status,
        completedAt: result.stage.completedAt
      },
      drive: result.drive || null
    })
  })

  getDriveStageProgress = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const result = await stageService.getDriveStageProgress({
      driveId,
      currentUser: req.user
    })

    successResponse(res, 200, 'Drive stage progress fetched successfully', result)
  })

  getApplicationsByStage = asyncHandler(async (req, res) => {
    const { driveId, stage } = req.params
    const pagination = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20
    }

    const result = await stageService.getApplicationsByStage({
      driveId,
      stage,
      collegeId: req.query.collegeId,
      currentUser: req.user,
      pagination
    })

    successResponse(res, 200, 'Applications fetched by stage successfully', result)
  })
}

module.exports = new StageController()
