const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

class StudentService {
  async confirmStudentsInsertion({ driveId, collegeId, studentsData, currentUser }) {
    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId } }
    })
    if (!driveCollege) throw new AppError('Drive not found or not assigned to college', 404)
    if (driveCollege.invitationStatus !== 'ACCEPTED') throw new AppError('Drive invitation not accepted', 403)

    const college = await prisma.college.findUnique({ where: { id: collegeId } })
    if (!college) throw new AppError('College not found', 404)

    if (driveCollege.managedBy === 'ADMIN') {
      if (currentUser.role !== 'ADMIN') throw new AppError('Only admin can confirm for admin-managed drive', 403)
    } else if (driveCollege.managedBy === 'COLLEGE') {
      if (currentUser.role !== 'COLLEGE' || college.userId !== currentUser.id) {
        throw new AppError('Only owning college can confirm for college-managed drive', 403)
      }
    } else {
      throw new AppError('Drive management not set', 400)
    }

    const normalized = []
    const seen = new Set()
    for (const s of studentsData || []) {
      const emailLower = String(s.email || '').toLowerCase().trim()
      if (!emailLower) continue
      if (seen.has(emailLower)) continue
      seen.add(emailLower)
      normalized.push({
        firstName: String(s.firstName || '').trim(),
        lastName: String(s.lastName || '').trim(),
        email: emailLower,
        phone: s.phone ? String(s.phone).trim() : null,
        course: s.course ? String(s.course).trim() : null,
        cgpa: typeof s.cgpa === 'number' ? s.cgpa : null
      })
    }

    const totalUploaded = normalized.length
    if (totalUploaded === 0) {
      throw new AppError('No valid students to insert', 400)
    }

    const existing = await prisma.student.findMany({
      where: { collegeId, email: { in: normalized.map(x => x.email) } },
      select: { email: true }
    })
    const existingSet = new Set(existing.map(e => e.email.toLowerCase()))
    const toInsert = normalized.filter(x => !existingSet.has(x.email))

    const result = await prisma.$transaction(async (tx) => {
      let inserted = 0
      if (toInsert.length > 0) {
        const createRes = await tx.student.createMany({
          data: toInsert.map(x => ({
            firstName: x.firstName,
            lastName: x.lastName,
            email: x.email,
            phone: x.phone,
            course: x.course,
            cgpa: x.cgpa,
            collegeId
          })),
          skipDuplicates: true
        })
        inserted = createRes.count
      }

      const allStudents = await tx.student.findMany({
        where: { collegeId, email: { in: normalized.map(x => x.email) } },
        select: { id: true, email: true }
      })

      const linkRes = await tx.driveStudent.createMany({
        data: allStudents.map(st => ({
          driveId,
          studentId: st.id,
          collegeId
        })),
        skipDuplicates: true
      })

      return {
        inserted,
        linked: linkRes.count
      }
    })

    return {
      totalUploaded,
      inserted: result.inserted,
      linked: result.linked
    }
  }
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

    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { currentStage: true, isLocked: true }
    })
    if (!drive || drive.isLocked || drive.currentStage !== 'APPLICATIONS') {
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
      firstName: s.firstName || String(s.name || '').trim().split(' ')[0] || 'Student',
      lastName: s.lastName || String(s.name || '').trim().split(' ').slice(1).join(' ') || 'NA',
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
            collegeId: college.id,
            status: 'APPLIED',
            currentStage: 'APPLICATIONS',
            stageHistory: [
              {
                fromStage: null,
                toStage: 'APPLICATIONS',
                status: 'APPLIED',
                movedAt: new Date().toISOString()
              }
            ]
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

    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { currentStage: true, isLocked: true }
    })
    if (!drive || drive.isLocked || drive.currentStage !== 'APPLICATIONS') {
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
      firstName: s.firstName || String(s.name || '').trim().split(' ')[0] || 'Student',
      lastName: s.lastName || String(s.name || '').trim().split(' ').slice(1).join(' ') || 'NA',
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
            collegeId,
            status: 'APPLIED',
            currentStage: 'APPLICATIONS',
            stageHistory: [
              {
                fromStage: null,
                toStage: 'APPLICATIONS',
                status: 'APPLIED',
                movedAt: new Date().toISOString()
              }
            ]
          }))
        })
      }
      return createdStudents.length
    })

    return { added: createdCount }
  }
}

module.exports = new StudentService()
