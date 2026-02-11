const collegeService = require('./college.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../../utils/asyncHandler')

class CollegeController {
  getProfile = asyncHandler(async (req, res) => {
    const college = await collegeService.getProfile(req.user.id)
    successResponse(res, 200, 'College profile retrieved successfully', college)
  })

  updateProfile = asyncHandler(async (req, res) => {
    const college = await collegeService.updateProfile(req.user.id, req.body)
    successResponse(res, 200, 'College profile updated successfully', college)
  })

  getAssignedDrives = asyncHandler(async (req, res) => {
    const drives = await collegeService.getAssignedDrives(req.user.id)
    successResponse(res, 200, 'Drives retrieved successfully', drives)
  })

  getDriveDetails = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const drive = await collegeService.getDriveDetails(req.user.id, driveId)
    successResponse(res, 200, 'Drive details retrieved successfully', drive)
  })
}

module.exports = new CollegeController()
