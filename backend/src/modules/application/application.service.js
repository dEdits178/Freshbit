const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

const STATUS_TRANSITIONS = {
  APPLIED: ['IN_TEST', 'REJECTED'],
  IN_TEST: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['IN_INTERVIEW', 'REJECTED'],
  IN_INTERVIEW: ['SELECTED', 'REJECTED'],
  SELECTED: ['REJECTED'],
  REJECTED: []
}

const STATUS_TO_STAGE = {
  APPLIED: 'APPLICATIONS',
  IN_TEST: 'TEST',
  SHORTLISTED: 'SHORTLIST',
  IN_INTERVIEW: 'INTERVIEW',
  SELECTED: 'FINAL',
  REJECTED: 'FINAL'
}

class ApplicationService {
  async createApplications({ driveId, collegeId, studentIds, currentUser }) {
    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId } }
    })

    if (!driveCollege) {
      throw new AppError('Drive not found or not assigned to college', 404)
    }

    if (driveCollege.invitationStatus !== 'ACCEPTED') {
      throw new AppError('Drive invitation not accepted', 403)
    }

    if (driveCollege.managedBy === 'ADMIN') {
      if (currentUser.role !== 'ADMIN') {
        throw new AppError('Only admin can create applications for admin-managed drive', 403)
      }
    } else if (driveCollege.managedBy === 'COLLEGE') {
      if (currentUser.role !== 'COLLEGE') {
        throw new AppError('Only college can create applications for college-managed drive', 403)
      }

      const college = await prisma.college.findUnique({ where: { id: collegeId } })
      if (!college || college.userId !== currentUser.id) {
        throw new AppError('Only owning college can create applications for this drive', 403)
      }
    } else {
      throw new AppError('Drive management not set', 400)
    }

    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        collegeId
      },
      select: { id: true }
    })

    if (students.length !== studentIds.length) {
      throw new AppError('Some students not found or do not belong to this college', 400)
    }

    const driveStudents = await prisma.driveStudent.findMany({
      where: {
        driveId,
        studentId: { in: studentIds },
        collegeId
      },
      select: { studentId: true }
    })

    if (driveStudents.length !== studentIds.length) {
      throw new AppError('Some students are not linked to this drive', 400)
    }

    const existingApplications = await prisma.application.findMany({
      where: {
        driveId,
        studentId: { in: studentIds }
      },
      select: { id: true }
    })

    if (existingApplications.length > 0) {
      throw new AppError('Some students already have applications for this drive', 400)
    }

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.application.createMany({
        data: studentIds.map(studentId => ({
          driveId,
          studentId,
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
        })),
        skipDuplicates: true
      })

      const createdApplications = await tx.application.findMany({
        where: { driveId, studentId: { in: studentIds } },
        select: { id: true, studentId: true }
      })

      await Promise.all(
        createdApplications.map(app =>
          tx.driveStudent.update({
            where: {
              driveId_studentId: {
                driveId,
                studentId: app.studentId
              }
            },
            data: { applicationId: app.id }
          })
        )
      )

      return { created: created.count }
    })

    return result
  }

  async getApplicationsByDrive({ driveId, currentUser, filters = {}, pagination = {} }) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { companyId: true }
    })

    if (!drive) {
      throw new AppError('Drive not found', 404)
    }

    if (currentUser.role === 'COMPANY') {
      const company = await prisma.company.findUnique({ where: { userId: currentUser.id } })
      if (!company || company.id !== drive.companyId) {
        throw new AppError('Access denied', 403)
      }
    }

    const page = Math.max(parseInt(pagination.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(pagination.limit, 10) || 20, 1), 100)
    const skip = (page - 1) * limit

    const { collegeId, status, currentStage, search } = filters
    const where = { driveId }

    if (currentUser.role === 'COLLEGE') {
      const college = await prisma.college.findUnique({ where: { userId: currentUser.id } })
      if (!college) {
        throw new AppError('College not found', 404)
      }
      where.collegeId = college.id
    } else if (collegeId) {
      where.collegeId = collegeId
    }

    if (status) where.status = status
    if (currentStage) where.currentStage = currentStage
    if (search) {
      where.OR = [
        {
          student: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              course: true,
              cgpa: true
            }
          },
          college: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      }),
      prisma.application.count({ where })
    ])

    const stats = await this.getApplicationStats({ driveId, currentUser })

    let groupedApplications = applications
    if (currentUser.role === 'COMPANY') {
      groupedApplications = applications.reduce((acc, app) => {
        if (!acc[app.collegeId]) {
          acc[app.collegeId] = {
            college: app.college,
            applications: []
          }
        }
        acc[app.collegeId].applications.push(app)
        return acc
      }, {})
    }

    return {
      applications: groupedApplications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats
    }
  }

  async getApplicationsByCollege({ driveId, collegeId, currentUser, filters = {}, pagination = {} }) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: {
        companyId: true,
        driveColleges: {
          where: { collegeId },
          select: { managedBy: true, invitationStatus: true }
        }
      }
    })

    if (!drive) {
      throw new AppError('Drive not found', 404)
    }

    const driveCollege = drive.driveColleges[0]
    if (!driveCollege) {
      throw new AppError('College not assigned to this drive', 404)
    }

    if (driveCollege.invitationStatus !== 'ACCEPTED') {
      throw new AppError('Drive invitation not accepted for this college', 403)
    }

    if (currentUser.role === 'COLLEGE') {
      const college = await prisma.college.findUnique({ where: { userId: currentUser.id } })
      if (!college || college.id !== collegeId) {
        throw new AppError('Access denied', 403)
      }
      if (driveCollege.managedBy === 'ADMIN') {
        throw new AppError('College cannot access admin-managed applications for this drive', 403)
      }
    }

    if (currentUser.role === 'COMPANY') {
      const company = await prisma.company.findUnique({
        where: { userId: currentUser.id },
        select: { id: true }
      })
      if (!company || company.id !== drive.companyId) {
        throw new AppError('Access denied', 403)
      }
    }

    const page = Math.max(parseInt(pagination.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(pagination.limit, 10) || 20, 1), 100)
    const skip = (page - 1) * limit

    const { status, currentStage, search } = filters
    const where = { driveId, collegeId }
    if (status) where.status = status
    if (currentStage) where.currentStage = currentStage
    if (search) {
      where.OR = [
        {
          student: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              course: true,
              cgpa: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      }),
      prisma.application.count({ where })
    ])

    return {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getApplicationStats({ driveId, currentUser }) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { companyId: true }
    })

    if (!drive) {
      throw new AppError('Drive not found', 404)
    }

    if (currentUser.role === 'COMPANY') {
      const company = await prisma.company.findUnique({ where: { userId: currentUser.id } })
      if (!company || company.id !== drive.companyId) {
        throw new AppError('Access denied', 403)
      }
    }

    const where = { driveId }
    if (currentUser.role === 'COLLEGE') {
      const college = await prisma.college.findUnique({ where: { userId: currentUser.id } })
      if (!college) {
        throw new AppError('College not found', 404)
      }
      where.collegeId = college.id
    }

    const isCollegeRole = currentUser.role === 'COLLEGE'
    const [total, statusStats, stageStats, collegeStats] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.groupBy({
        by: ['status'],
        where,
        _count: { _all: true }
      }),
      prisma.application.groupBy({
        by: ['currentStage'],
        where,
        _count: { _all: true }
      }),
      isCollegeRole
        ? Promise.resolve(null)
        : prisma.application.groupBy({
            by: ['collegeId'],
            where,
            _count: { _all: true }
          })
    ])

    return {
      total,
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count._all
        return acc
      }, {}),
      byStage: stageStats.reduce((acc, stat) => {
        acc[stat.currentStage] = stat._count._all
        return acc
      }, {}),
      byCollege: collegeStats
        ? collegeStats.reduce((acc, stat) => {
            acc[stat.collegeId] = stat._count._all
            return acc
          }, {})
        : null
    }
  }

  async updateApplicationStatus({ applicationId, status, currentUser }) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        drive: { select: { companyId: true } }
      }
    })

    if (!application) {
      throw new AppError('Application not found', 404)
    }

    if (currentUser.role === 'COMPANY') {
      const company = await prisma.company.findUnique({ where: { userId: currentUser.id } })
      if (!company || company.id !== application.drive.companyId) {
        throw new AppError('Access denied', 403)
      }
    } else if (currentUser.role === 'COLLEGE') {
      throw new AppError('Colleges cannot update application status', 403)
    }

    if (!STATUS_TRANSITIONS[application.status]) {
      throw new AppError(`Unknown current status: ${application.status}`, 400)
    }

    if (!STATUS_TRANSITIONS[application.status].includes(status)) {
      throw new AppError(`Invalid status transition from ${application.status} to ${status}`, 400)
    }

    const nextStage = STATUS_TO_STAGE[status] || application.currentStage
    const existingHistory = Array.isArray(application.stageHistory) ? application.stageHistory : []
    const stageHistory = [
      ...existingHistory,
      {
        fromStatus: application.status,
        toStatus: status,
        fromStage: application.currentStage,
        toStage: nextStage,
        movedAt: new Date().toISOString()
      }
    ]

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        currentStage: nextStage,
        selectedAt: status === 'SELECTED' ? new Date() : application.selectedAt,
        rejectedAt: status === 'REJECTED' ? new Date() : application.rejectedAt,
        stageHistory
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        college: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return updatedApplication
  }
}

module.exports = new ApplicationService()
