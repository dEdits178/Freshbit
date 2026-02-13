const selectionService = require('./selection.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../utils/asyncHandler')

class SelectionController {
  uploadShortlist = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId, studentEmails, preview } = req.body

    const result = await selectionService.uploadShortlist({
      driveId,
      collegeId,
      studentEmails,
      currentUser: req.user,
      preview: Boolean(preview)
    })

    const message = result.preview
      ? `Preview generated for ${result.shortlisted} shortlist candidates`
      : `${result.shortlisted} students shortlisted successfully${result.notFound.length ? `. ${result.notFound.length} email(s) not found.` : ''}`

    successResponse(res, 200, message, result)
  })

  uploadInterviewList = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId, studentEmails, preview } = req.body

    const result = await selectionService.uploadInterviewList({
      driveId,
      collegeId,
      studentEmails,
      currentUser: req.user,
      preview: Boolean(preview)
    })

    const message = result.preview
      ? `Preview generated for ${result.interviewed} interview candidates`
      : `${result.interviewed} students moved to interview successfully${result.notFound.length ? `. ${result.notFound.length} email(s) not found.` : ''}`

    successResponse(res, 200, message, result)
  })

  finalizeSelections = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId, studentEmails, preview } = req.body

    const result = await selectionService.finalizeSelections({
      driveId,
      collegeId,
      studentEmails,
      currentUser: req.user,
      preview: Boolean(preview)
    })

    const message = result.preview
      ? `Preview generated for ${result.selected} final selections`
      : `${result.selected} students finalized successfully${result.notFound.length ? `. ${result.notFound.length} email(s) not found.` : ''}`

    successResponse(res, 200, message, result)
  })

  bulkRejectApplications = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId, studentEmails, currentStage, preview } = req.body

    const result = await selectionService.bulkRejectApplications({
      driveId,
      collegeId,
      studentEmails,
      currentStage,
      currentUser: req.user,
      preview: Boolean(preview)
    })

    const message = result.preview
      ? `Preview generated for ${result.rejected} rejections`
      : `${result.rejected} applications rejected successfully`

    successResponse(res, 200, message, result)
  })

  getShortlistedApplications = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId, page = 1, limit = 20 } = req.query

    const result = await selectionService.getShortlistedApplications({
      driveId,
      collegeId,
      currentUser: req.user,
      pagination: { page, limit }
    })

    successResponse(res, 200, 'Shortlisted applications fetched successfully', result)
  })

  getInterviewApplications = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId, page = 1, limit = 20 } = req.query

    const result = await selectionService.getInterviewApplications({
      driveId,
      collegeId,
      currentUser: req.user,
      pagination: { page, limit }
    })

    successResponse(res, 200, 'Interview applications fetched successfully', result)
  })

  getFinalSelections = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId, page = 1, limit = 20 } = req.query

    const result = await selectionService.getFinalSelections({
      driveId,
      collegeId,
      currentUser: req.user,
      pagination: { page, limit }
    })

    successResponse(res, 200, 'Final selections fetched successfully', result)
  })

  getSelectionStats = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId } = req.query

    const result = await selectionService.getSelectionStats({
      driveId,
      collegeId,
      currentUser: req.user
    })

    successResponse(res, 200, 'Selection stats fetched successfully', result)
  })

  validateEmailsAgainstStudents = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId, emails } = req.body

    const result = await selectionService.validateEmailsAgainstStudents({
      driveId,
      collegeId,
      emails,
      currentUser: req.user
    })

    successResponse(res, 200, 'Email validation completed', result)
  })

  closeCollegeDrive = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId } = req.body

    const result = await selectionService.closeCollegeDrive({
      driveId,
      collegeId,
      currentUser: req.user
    })

    successResponse(res, 200, 'College drive closed successfully', {
      driveCollege: result
    })
  })
}

module.exports = new SelectionController()
