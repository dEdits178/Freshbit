const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

const STAGE_ORDER = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL']

class ApplicationService {
  async getDriveApplicationsForCompany(companyUserId, driveId) {
    const company = await prisma.company.findUnique({ where: { userId: companyUserId } })
    if (!company) throw new AppError('Company profile not found', 404)

    const drive = await prisma.drive.findUnique({ where: { id: driveId } })
    if (!drive) throw new AppError('Drive not found', 404)
    if (drive.companyId !== company.id) throw new AppError('You do not have permission to view this drive', 403)

    const [applications, activeStages] = await Promise.all([
      prisma.application.findMany({
        where: { driveId },
        include: {
          student: {
            include: {
              college: {
                select: { id: true, name: true, city: true, state: true }
              }
            }
          }
        }
      }),
      prisma.driveStage.findMany({
        where: { driveId, status: 'ACTIVE' },
        select: { collegeId: true, stage: true }
      })
    ])

    const activeStageMap = new Map(activeStages.map(s => [s.collegeId, s.stage]))
    const grouped = {}
    for (const app of applications) {
      const college = app.student.college
      if (!grouped[college.id]) {
        grouped[college.id] = {
          college: college,
          currentStage: activeStageMap.get(college.id) || null,
          applications: []
        }
      }
      grouped[college.id].applications.push({
        student: {
          id: app.student.id,
          name: app.student.name,
          email: app.student.email,
          cgpa: app.student.cgpa
        },
        status: app.status
      })
    }
    return Object.values(grouped)
  }

  async moveStageForCollege(collegeUserId, driveId, stage) {
    const college = await prisma.college.findUnique({ where: { userId: collegeUserId } })
    if (!college) throw new AppError('College profile not found', 404)

    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId: college.id } }
    })
    if (!driveCollege) throw new AppError('Drive not found or not assigned to your college', 404)
    if (driveCollege.invitationStatus !== 'ACCEPTED') throw new AppError('Drive invitation not accepted', 403)
    if (driveCollege.managedBy !== 'COLLEGE') throw new AppError('Drive is not managed by college', 403)

    const current = await prisma.driveStage.findUnique({
      where: { driveId_collegeId_stage: { driveId, collegeId: college.id, stage } }
    })
    if (!current) throw new AppError('Stage record not found', 404)
    if (current.status !== 'ACTIVE') throw new AppError('Current stage is not active', 400)

    const idx = STAGE_ORDER.indexOf(stage)
    if (idx === -1) throw new AppError('Invalid stage', 400)
    if (idx === STAGE_ORDER.length - 1) throw new AppError('FINAL stage cannot move forward', 400)

    const nextStage = STAGE_ORDER[idx + 1]

    return await prisma.$transaction(async (tx) => {
      await tx.driveStage.update({
        where: { driveId_collegeId_stage: { driveId, collegeId: college.id, stage } },
        data: { status: 'COMPLETED' }
      })

      await tx.driveStage.update({
        where: { driveId_collegeId_stage: { driveId, collegeId: college.id, stage: nextStage } },
        data: { status: 'ACTIVE' }
      })

      await tx.application.updateMany({
        where: {
          driveId,
          student: { collegeId: college.id }
        },
        data: { status: nextStage }
      })

      return { movedTo: nextStage }
    })
  }

  async moveStageForAdmin(driveId, collegeId, stage) {
    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId } }
    })
    if (!driveCollege) throw new AppError('Drive invitation not found', 404)
    if (driveCollege.invitationStatus !== 'ACCEPTED') throw new AppError('Drive invitation not accepted', 403)
    if (driveCollege.managedBy !== 'ADMIN') throw new AppError('Drive is not managed by admin', 403)

    const current = await prisma.driveStage.findUnique({
      where: { driveId_collegeId_stage: { driveId, collegeId, stage } }
    })
    if (!current) throw new AppError('Stage record not found', 404)
    if (current.status !== 'ACTIVE') throw new AppError('Current stage is not active', 400)

    const idx = STAGE_ORDER.indexOf(stage)
    if (idx === -1) throw new AppError('Invalid stage', 400)
    if (idx === STAGE_ORDER.length - 1) throw new AppError('FINAL stage cannot move forward', 400)

    const nextStage = STAGE_ORDER[idx + 1]

    return await prisma.$transaction(async (tx) => {
      await tx.driveStage.update({
        where: { driveId_collegeId_stage: { driveId, collegeId, stage } },
        data: { status: 'COMPLETED' }
      })

      await tx.driveStage.update({
        where: { driveId_collegeId_stage: { driveId, collegeId, stage: nextStage } },
        data: { status: 'ACTIVE' }
      })

      await tx.application.updateMany({
        where: { driveId, student: { collegeId } },
        data: { status: nextStage }
      })

      return { movedTo: nextStage }
    })
  }

  async uploadShortlist(collegeUserId, driveId, studentIds) {
    const college = await prisma.college.findUnique({ where: { userId: collegeUserId } })
    if (!college) throw new AppError('College profile not found', 404)

    const testStage = await prisma.driveStage.findUnique({
      where: { driveId_collegeId_stage: { driveId, collegeId: college.id, stage: 'TEST' } }
    })
    if (!testStage || testStage.status !== 'ACTIVE') throw new AppError('TEST stage is not active', 400)

    await prisma.application.updateMany({
      where: {
        driveId,
        studentId: { in: studentIds },
        student: { collegeId: college.id }
      },
      data: { status: 'SHORTLIST' }
    })

    return { updated: studentIds.length }
  }

  async uploadShortlistAdmin(driveId, collegeId, studentIds) {
    const testStage = await prisma.driveStage.findUnique({
      where: { driveId_collegeId_stage: { driveId, collegeId, stage: 'TEST' } }
    })
    if (!testStage || testStage.status !== 'ACTIVE') throw new AppError('TEST stage is not active', 400)

    await prisma.application.updateMany({
      where: { driveId, studentId: { in: studentIds }, student: { collegeId } },
      data: { status: 'SHORTLIST' }
    })

    return { updated: studentIds.length }
  }

  async finalizeSelection(collegeUserId, driveId, selectedStudentIds) {
    const college = await prisma.college.findUnique({ where: { userId: collegeUserId } })
    if (!college) throw new AppError('College profile not found', 404)

    const interviewStage = await prisma.driveStage.findUnique({
      where: { driveId_collegeId_stage: { driveId, collegeId: college.id, stage: 'INTERVIEW' } }
    })
    if (!interviewStage || interviewStage.status !== 'ACTIVE') throw new AppError('INTERVIEW stage is not active', 400)

    return await prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: {
          driveId,
          studentId: { in: selectedStudentIds },
          student: { collegeId: college.id }
        },
        data: { status: 'FINAL' }
      })

      await tx.driveStage.update({
        where: { driveId_collegeId_stage: { driveId, collegeId: college.id, stage: 'INTERVIEW' } },
        data: { status: 'COMPLETED' }
      })

      await tx.driveStage.update({
        where: { driveId_collegeId_stage: { driveId, collegeId: college.id, stage: 'FINAL' } },
        data: { status: 'COMPLETED' }
      })

      return { finalized: selectedStudentIds.length }
    })
  }

  async finalizeSelectionAdmin(driveId, collegeId, selectedStudentIds) {
    const interviewStage = await prisma.driveStage.findUnique({
      where: { driveId_collegeId_stage: { driveId, collegeId, stage: 'INTERVIEW' } }
    })
    if (!interviewStage || interviewStage.status !== 'ACTIVE') throw new AppError('INTERVIEW stage is not active', 400)

    return await prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: { driveId, studentId: { in: selectedStudentIds }, student: { collegeId } },
        data: { status: 'FINAL' }
      })

      await tx.driveStage.update({
        where: { driveId_collegeId_stage: { driveId, collegeId, stage: 'INTERVIEW' } },
        data: { status: 'COMPLETED' }
      })

      await tx.driveStage.update({
        where: { driveId_collegeId_stage: { driveId, collegeId, stage: 'FINAL' } },
        data: { status: 'COMPLETED' }
      })

      return { finalized: selectedStudentIds.length }
    })
  }
}

module.exports = new ApplicationService()
