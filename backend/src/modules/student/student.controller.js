const studentService = require('./student.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../../utils/asyncHandler')

class StudentController {
  bulkUpload = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const result = await studentService.bulkUploadStudents(req.user.id, driveId, req.body.students)
    successResponse(res, 201, 'Students uploaded successfully', result)
  })

  adminBulkUpload = asyncHandler(async (req, res) => {
    const { driveId, collegeId } = req.params
    const result = await studentService.bulkUploadStudentsAdmin(driveId, collegeId, req.body.students)
    successResponse(res, 201, 'Students uploaded successfully', result)
  })
}

module.exports = new StudentController()
