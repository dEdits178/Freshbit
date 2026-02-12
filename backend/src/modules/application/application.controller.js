const applicationService = require('./application.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../../utils/asyncHandler')

class ApplicationController {
  getDriveApplications = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const data = await applicationService.getDriveApplicationsForCompany(req.user.id, driveId)
    successResponse(res, 200, 'Applications retrieved successfully', data)
  })

  moveStageCollege = asyncHandler(async (req, res) => {
    const { driveId, stage } = req.params
    const result = await applicationService.moveStageForCollege(req.user.id, driveId, stage)
    successResponse(res, 200, 'Stage moved successfully', result)
  })

  moveStageAdmin = asyncHandler(async (req, res) => {
    const { driveId, collegeId, stage } = req.params
    const result = await applicationService.moveStageForAdmin(driveId, collegeId, stage)
    successResponse(res, 200, 'Stage moved successfully', result)
  })

  uploadShortlistCollege = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { studentIds } = req.body
    const result = await applicationService.uploadShortlist(req.user.id, driveId, studentIds)
    successResponse(res, 200, 'Shortlist uploaded successfully', result)
  })

  uploadShortlistAdmin = asyncHandler(async (req, res) => {
    const { driveId, collegeId } = req.params
    const { studentIds } = req.body
    const result = await applicationService.uploadShortlistAdmin(driveId, collegeId, studentIds)
    successResponse(res, 200, 'Shortlist uploaded successfully', result)
  })

  finalizeCollege = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { selectedStudentIds } = req.body
    const result = await applicationService.finalizeSelection(req.user.id, driveId, selectedStudentIds)
    successResponse(res, 200, 'Final selection completed', result)
  })

  finalizeAdmin = asyncHandler(async (req, res) => {
    const { driveId, collegeId } = req.params
    const { selectedStudentIds } = req.body
    const result = await applicationService.finalizeSelectionAdmin(driveId, collegeId, selectedStudentIds)
    successResponse(res, 200, 'Final selection completed', result)
  })
}

module.exports = new ApplicationController()
