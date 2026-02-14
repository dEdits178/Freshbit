const collegeService = require('./college.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../utils/asyncHandler')

class CollegeController {
  // Dashboard stats
  getStats = asyncHandler(async (req, res) => {
    const stats = await collegeService.getStats(req.user.id)
    successResponse(res, 200, 'Stats retrieved successfully', stats)
  })

  // Profile management
  getProfile = asyncHandler(async (req, res) => {
    const college = await collegeService.getProfile(req.user.id)
    successResponse(res, 200, 'College profile retrieved successfully', college)
  })

  updateProfile = asyncHandler(async (req, res) => {
    const college = await collegeService.updateProfile(req.user.id, req.body)
    successResponse(res, 200, 'College profile updated successfully', college)
  })

  // Invitations
  getInvitations = asyncHandler(async (req, res) => {
    const { status } = req.query
    const invitations = await collegeService.getInvitations(req.user.id, status)
    successResponse(res, 200, 'Invitations retrieved successfully', invitations)
  })

  acceptInvitation = asyncHandler(async (req, res) => {
    const { invitationId } = req.params
    const result = await collegeService.acceptInvitation(req.user.id, invitationId)
    successResponse(res, 200, 'Invitation accepted successfully', result)
  })

  rejectInvitation = asyncHandler(async (req, res) => {
    const { invitationId } = req.params
    const { reason } = req.body
    const result = await collegeService.rejectInvitation(req.user.id, invitationId, reason)
    successResponse(res, 200, 'Invitation rejected successfully', result)
  })

  // Drives
  getAssignedDrives = asyncHandler(async (req, res) => {
    const drives = await collegeService.getAssignedDrives(req.user.id)
    successResponse(res, 200, 'Drives retrieved successfully', drives)
  })

  getDriveDetails = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const drive = await collegeService.getDriveDetails(req.user.id, driveId)
    successResponse(res, 200, 'Drive details retrieved successfully', drive)
  })

  // Student management
  uploadStudents = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const file = req.file
    const result = await collegeService.uploadStudents(req.user.id, driveId, file)
    successResponse(res, 200, 'Students uploaded successfully', result)
  })

  confirmStudents = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { students } = req.body
    const result = await collegeService.confirmStudents(req.user.id, driveId, students)
    successResponse(res, 200, 'Students confirmed successfully', result)
  })

  getStudents = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const params = req.query
    const result = await collegeService.getStudents(req.user.id, driveId, params)
    successResponse(res, 200, 'Students retrieved successfully', result)
  })

  deleteStudent = asyncHandler(async (req, res) => {
    const { driveId, studentId } = req.params
    await collegeService.deleteStudent(req.user.id, driveId, studentId)
    successResponse(res, 200, 'Student deleted successfully')
  })

  exportStudents = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const params = req.query
    const csv = await collegeService.exportStudents(req.user.id, driveId, params)

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=students_${driveId}_${Date.now()}.csv`)
    res.send(csv)
  })

  // Templates
  downloadTemplate = asyncHandler(async (req, res) => {
    const csv = 'name,email,phone,rollNo,branch,cgpa,graduationYear\nRahul Kumar,rahul@example.com,9876543210,2021CS101,Computer Science,8.5,2025\n'

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=student_template.csv')
    res.send(csv)
  })
}

module.exports = new CollegeController()
