const companyCollegeService = require('./companyCollege.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../utils/asyncHandler')

class CompanyCollegeController {
  // Get all approved colleges (for browsing/inviting)
  getColleges = asyncHandler(async (req, res) => {
    const { search, page = 1, limit = 50 } = req.query
    const result = await companyCollegeService.getColleges(req.user.id, { search, page: parseInt(page), limit: parseInt(limit) })
    successResponse(res, 200, 'Colleges retrieved successfully', result)
  })

  // Get invited colleges for a specific drive
  getDriveColleges = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const result = await companyCollegeService.getDriveColleges(req.user.id, driveId)
    successResponse(res, 200, 'Drive colleges retrieved successfully', result)
  })

  // Get specific college details within a drive
  getDriveCollegeById = asyncHandler(async (req, res) => {
    const { driveId, collegeId } = req.params
    const result = await companyCollegeService.getDriveCollegeById(req.user.id, driveId, collegeId)
    successResponse(res, 200, 'Drive college retrieved successfully', result)
  })

  // Invite colleges to a drive
  inviteColleges = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeIds, managedBy = 'COLLEGE' } = req.body
    const result = await companyCollegeService.inviteColleges(req.user.id, driveId, collegeIds, managedBy)
    successResponse(res, 201, 'Colleges invited successfully', result)
  })

  // Update college invitation status in a drive (admin override)
  updateCollegeStatus = asyncHandler(async (req, res) => {
    const { driveId, collegeId } = req.params
    const { status, managedBy } = req.body
    const result = await companyCollegeService.updateCollegeStatus(req.user.id, driveId, collegeId, status, managedBy)
    successResponse(res, 200, 'College status updated successfully', result)
  })

  // Get selections for a drive (optionally filtered by collegeId)
  getSelections = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { collegeId } = req.query
    const result = await companyCollegeService.getSelections(req.user.id, driveId, collegeId)
    successResponse(res, 200, 'Selections retrieved successfully', result)
  })

  // Get stage progress for a specific college in a drive
  getCollegeStageProgress = asyncHandler(async (req, res) => {
    const { driveId, collegeId } = req.params
    const result = await companyCollegeService.getCollegeStageProgress(req.user.id, driveId, collegeId)
    successResponse(res, 200, 'Stage progress retrieved successfully', result)
  })

  // Get upload logs for a specific college in a drive
  getCollegeUploads = asyncHandler(async (req, res) => {
    const { driveId, collegeId } = req.params
    const result = await companyCollegeService.getCollegeUploads(req.user.id, driveId, collegeId)
    successResponse(res, 200, 'Upload logs retrieved successfully', result)
  })
}

module.exports = new CompanyCollegeController()
