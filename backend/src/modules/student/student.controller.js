const studentService = require('./student.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../../utils/asyncHandler')
const prisma = require('../../../prisma/client')

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

  confirm = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    let collegeId = req.body.collegeId
    if (req.user.role === 'COLLEGE') {
      const college = await prisma.college.findUnique({ where: { userId: req.user.id } })
      collegeId = college.id
    }
    const data = await studentService.confirmStudentsInsertion({
      driveId,
      collegeId,
      studentsData: req.body.students || [],
      currentUser: req.user
    })
    successResponse(res, 200, 'Students confirmed', data)
  })
}

module.exports = new StudentController()
