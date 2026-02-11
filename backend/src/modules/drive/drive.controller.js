const driveService = require('./drive.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../../utils/asyncHandler')

class DriveController {
  createDrive = asyncHandler(async (req, res) => {
    const drive = await driveService.createDrive(req.user.id, req.body)
    successResponse(res, 201, 'Drive created successfully', drive)
  })

  publishDrive = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const drive = await driveService.publishDrive(req.user.id, driveId)
    successResponse(res, 200, 'Drive published successfully', drive)
  })

  getCompanyDrives = asyncHandler(async (req, res) => {
    const drives = await driveService.getCompanyDrives(req.user.id)
    successResponse(res, 200, 'Drives retrieved successfully', drives)
  })

  getDriveById = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const drive = await driveService.getDriveById(req.user.id, driveId)
    successResponse(res, 200, 'Drive retrieved successfully', drive)
  })

  respondToDrive = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { action } = req.body
    const result = await driveService.respondToDrive(req.user.id, driveId, action)
    successResponse(res, 200, `Drive ${action.toLowerCase()}ed successfully`, result)
  })

  adminOverrideDrive = asyncHandler(async (req, res) => {
    const { driveId, collegeId } = req.params
    const { action } = req.body
    const result = await driveService.adminOverrideDrive(driveId, collegeId, action)
    successResponse(res, 200, `Drive ${action.toLowerCase().replace('_', ' ')}ed successfully`, result)
  })
}

module.exports = new DriveController()
