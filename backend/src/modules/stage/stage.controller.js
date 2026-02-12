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
    successResponse(res, 200, 'Next stage activated successfully', result)
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

    successResponse(res, 200, `${result.rejected} applications rejected successfully`, result)
  })

  completeCurrentStage = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const result = await stageService.completeCurrentStage({
      driveId,
      currentUser: req.user
    })

    successResponse(res, 200, 'Current stage completed successfully', result)
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
