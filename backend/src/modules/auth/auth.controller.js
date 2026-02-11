const authService = require('./auth.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../../utils/asyncHandler')

class AuthController {
  registerCompany = asyncHandler(async (req, res) => {
    const result = await authService.registerCompany(req.body)
    successResponse(res, 201, result.message, result.user)
  })

  registerCollege = asyncHandler(async (req, res) => {
    const result = await authService.registerCollege(req.body)
    successResponse(res, 201, result.message, result.user)
  })

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body)
    successResponse(res, 200, 'Login successful', result)
  })

  approveUser = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const result = await authService.approveUser(userId)
    successResponse(res, 200, result.message, result.user)
  })
}

module.exports = new AuthController()
