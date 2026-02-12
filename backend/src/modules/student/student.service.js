const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

class StudentService {
  async bulkUploadStudents(collegeUserId, driveId, students) {
    const college = await prisma.college.findUnique({
      where: { userId: collegeUserId }
    })
    if (!college) {
      throw new AppError('College profile not found', 404)
    }

    const driveCollege = await prisma.driveCollege.findUnique({
      where: {
        driveId_collegeId: { driveId, collegeId: college.id }
      }
    })
    if (!driveCollege) {
      throw new AppError('Drive not found or not assigned to your college', 404)
    }
    if (driveCollege.invitationStatus !== 'ACCEPTED') {
      throw new AppError('Drive invitation not accepted', 403)
    }
    if (driveCollege.managedBy !== 'COLLEGE') {
      throw new AppError('Drive is not managed by college', 403)
    }

    const appStage = await prisma.driveStage.findUnique({
      where: {
        driveId_collegeId_stage: {
          driveId,
          collegeId: college.id,
          stage: 'APPLICATIONS'
        }
      }
    })
    if (!appStage || appStage.status !== 'ACTIVE') {
      throw new AppError('APPLICATIONS stage is not active', 400)
    }

    const existingApplicationsCount = await prisma.application.count({
      where: {
        driveId,
        student: {
          collegeId: college.id
        }
      }
    })
    if (existingApplicationsCount > 0) {
      throw new AppError('Students already uploaded for this drive', 400)
    }

    const emails = students.map(s => s.email)
    const existingStudents = await prisma.student.findMany({
      where: {
        collegeId: college.id,
        email: { in: emails }
      },
      select: { email: true }
    })
    const existingEmailSet = new Set(existingStudents.map(s => s.email))

    const toCreate = students.filter(s => !existingEmailSet.has(s.email)).map(s => ({
      collegeId: college.id,
      name: s.name,
      email: s.email,
      cgpa: s.cgpa
    }))

    const createdCount = await prisma.$transaction(async (tx) => {
      if (toCreate.length > 0) {
        await tx.student.createMany({ data: toCreate })
      }

      const createdStudents = await tx.student.findMany({
        where: {
          collegeId: college.id,
          email: { in: emails }
        },
        select: { id: true }
      })

      if (createdStudents.length > 0) {
        await tx.application.createMany({
          data: createdStudents.map(st => ({
            studentId: st.id,
            driveId,
            status: 'APPLICATIONS'
          }))
        })
      }

      return createdStudents.length
    })

    return { added: createdCount }
  }

  async bulkUploadStudentsAdmin(driveId, collegeId, students) {
    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId } }
    })
    if (!driveCollege) {
      throw new AppError('Drive invitation not found', 404)
    }
    if (driveCollege.invitationStatus !== 'ACCEPTED') {
      throw new AppError('Drive invitation not accepted', 403)
    }
    if (driveCollege.managedBy !== 'ADMIN') {
      throw new AppError('Drive is not managed by admin', 403)
    }

    const appStage = await prisma.driveStage.findUnique({
      where: { driveId_collegeId_stage: { driveId, collegeId, stage: 'APPLICATIONS' } }
    })
    if (!appStage || appStage.status !== 'ACTIVE') {
      throw new AppError('APPLICATIONS stage is not active', 400)
    }

    const existingApplicationsCount = await prisma.application.count({
      where: { driveId, student: { collegeId } }
    })
    if (existingApplicationsCount > 0) {
      throw new AppError('Students already uploaded for this drive', 400)
    }

    const emails = students.map(s => s.email)
    const existingStudents = await prisma.student.findMany({
      where: { collegeId, email: { in: emails } },
      select: { email: true }
    })
    const existingEmailSet = new Set(existingStudents.map(s => s.email))

    const toCreate = students.filter(s => !existingEmailSet.has(s.email)).map(s => ({
      collegeId,
      name: s.name,
      email: s.email,
      cgpa: s.cgpa
    }))

    const createdCount = await prisma.$transaction(async (tx) => {
      if (toCreate.length > 0) {
        await tx.student.createMany({ data: toCreate })
      }
      const createdStudents = await tx.student.findMany({
        where: { collegeId, email: { in: emails } },
        select: { id: true }
      })
      if (createdStudents.length > 0) {
        await tx.application.createMany({
          data: createdStudents.map(st => ({
            studentId: st.id,
            driveId,
            status: 'APPLICATIONS'
          }))
        })
      }
      return createdStudents.length
    })

    return { added: createdCount }
  }
}

module.exports = new StudentService()
