const applicationService = require('./application.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../utils/asyncHandler')
const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

class ApplicationController {
  createApplications = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { studentIds } = req.body
    const currentUser = req.user

    let collegeId = req.body.collegeId
    if (currentUser.role === 'COLLEGE') {
      const college = await prisma.college.findUnique({ where: { userId: currentUser.id } })
      if (!college) {
        throw new AppError('College profile not found', 404)
      }
      collegeId = college.id
    }

    const result = await applicationService.createApplications({
      driveId,
      collegeId,
      studentIds,
      currentUser
    })

    successResponse(res, 201, 'Applications created successfully', result)
  })

  getApplicationsByDrive = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const currentUser = req.user
    
    const filters = {
      collegeId: req.query.collegeId,
      status: req.query.status,
      currentStage: req.query.currentStage,
      search: req.query.search
    }
    
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    }

    const result = await applicationService.getApplicationsByDrive({
      driveId,
      currentUser,
      filters,
      pagination
    })

    successResponse(res, 200, 'Applications fetched successfully', result)
  })

  getApplicationsByCollege = asyncHandler(async (req, res) => {
    const { driveId, collegeId } = req.params
    const currentUser = req.user
    
    const filters = {
      status: req.query.status,
      currentStage: req.query.currentStage,
      search: req.query.search
    }
    
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    }

    const result = await applicationService.getApplicationsByCollege({
      driveId,
      collegeId,
      currentUser,
      filters,
      pagination
    })

    successResponse(res, 200, 'Applications fetched successfully', result)
  })

  getApplicationStats = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const currentUser = req.user

    const result = await applicationService.getApplicationStats({
      driveId,
      currentUser
    })

    successResponse(res, 200, 'Application stats fetched successfully', result)
  })

  updateApplicationStatus = asyncHandler(async (req, res) => {
    const { applicationId } = req.params
    const { status } = req.body
    const currentUser = req.user

    const result = await applicationService.updateApplicationStatus({
      applicationId,
      status,
      currentUser
    })

    successResponse(res, 200, 'Application status updated successfully', result)
  })
}

const controller = new ApplicationController()
module.exports = controller
