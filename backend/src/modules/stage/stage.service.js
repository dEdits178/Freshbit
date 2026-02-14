const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

const STAGE_FLOW = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL']
const STAGE_ORDER = STAGE_FLOW.reduce((acc, stage, index) => {
  acc[stage] = index + 1
  return acc
}, {})

const STAGE_STATUS_MAP = {
  TEST: 'IN_TEST',
  SHORTLIST: 'SHORTLISTED',
  INTERVIEW: 'IN_INTERVIEW',
  FINAL: 'SELECTED'
}

class StageService {
  async initializeDriveStages({ driveId }) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { id: true, currentStage: true }
    })

    if (!drive) throw new AppError('Drive not found', 404)

    const stages = await prisma.$transaction(async (tx) => {
      const existing = await tx.stage.findMany({ where: { driveId } })
      if (existing.length > 0) {
        throw new AppError('Stages already initialized for this drive', 400)
      }

      await tx.stage.createMany({
        data: STAGE_FLOW.map((name, index) => ({
          driveId,
          name,
          order: index + 1,
          status: name === 'APPLICATIONS' ? 'ACTIVE' : 'PENDING',
          startedAt: name === 'APPLICATIONS' ? new Date() : null
        }))
      })

      await tx.drive.update({
        where: { id: driveId },
        data: { currentStage: 'APPLICATIONS' }
      })

      return tx.stage.findMany({ where: { driveId }, orderBy: { order: 'asc' } })
    })

    return stages
  }

  async activateNextStage({ driveId, currentUser }) {
    const drive = await this._validateDriveAccess({ driveId, currentUser, allowCompanyOwner: true })
    await this._validateManagedByForDriveAction({ driveId, currentUser, allowCompany: true })

    const stages = await prisma.stage.findMany({
      where: { driveId },
      orderBy: { order: 'asc' }
    })
    if (stages.length === 0) throw new AppError('Stages not initialized', 400)

    const currentStage = stages.find(s => s.name === drive.currentStage)
    if (!currentStage) throw new AppError('Current stage not found', 404)

    if (currentStage.name === 'FINAL') {
      throw new AppError('Already at FINAL stage. No next stage available', 400)
    }

    if (currentStage.status !== 'COMPLETED') {
      throw new AppError('Current stage must be completed before activating next stage', 400)
    }

    const nextStage = stages.find(s => s.order === currentStage.order + 1)
    if (!nextStage) throw new AppError('Next stage not found', 404)

    const result = await prisma.$transaction(async (tx) => {
      const updatedNext = await tx.stage.update({
        where: { id: nextStage.id },
        data: {
          status: 'ACTIVE',
          startedAt: nextStage.startedAt || new Date()
        }
      })

      const updatedDrive = await tx.drive.update({
        where: { id: driveId },
        data: { currentStage: updatedNext.name }
      })

      return {
        currentStage,
        nextStage: updatedNext,
        drive: updatedDrive
      }
    })

    return result
  }

  async progressApplicationsToStage({ driveId, collegeId, applicationIds, targetStage, currentUser }) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { id: true, isLocked: true, currentStage: true, companyId: true }
    })

    if (!drive) throw new AppError('Drive not found', 404)
    if (drive.isLocked) throw new AppError('Drive already locked', 400)

    const activeStage = await prisma.stage.findFirst({ where: { driveId, status: 'ACTIVE' } })
    if (!activeStage) throw new AppError('No active stage found', 400)
    if (activeStage.name !== targetStage) throw new AppError('Target stage is not active', 400)
    if (drive.currentStage !== targetStage) throw new AppError('Drive current stage does not match target stage', 400)

    const dc = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId } },
      select: { managedBy: true, invitationStatus: true, college: { select: { userId: true } } }
    })
    if (!dc) throw new AppError('Drive-college mapping not found', 404)
    if (dc.invitationStatus !== 'ACCEPTED') throw new AppError('Drive invitation not accepted for this college', 403)

    this._validateManagedByActor({ managedBy: dc.managedBy, currentUser, collegeUserId: dc.college.userId })

    const currentOrder = STAGE_ORDER[targetStage]
    if (!currentOrder || currentOrder <= 1) {
      throw new AppError('Applications cannot be progressed into APPLICATIONS stage', 400)
    }
    const previousStage = STAGE_FLOW[currentOrder - 2]

    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        driveId,
        collegeId,
        status: { not: 'REJECTED' }
      },
      select: { id: true, currentStage: true, stageHistory: true }
    })

    if (applications.length !== applicationIds.length) {
      throw new AppError('Some applications not found for this drive/college', 400)
    }

    const invalid = applications.filter(app => app.currentStage !== previousStage)
    if (invalid.length > 0) {
      throw new AppError(`Applications not in required previous stage: ${previousStage}`, 400)
    }

    const nextStatus = STAGE_STATUS_MAP[targetStage]
    if (!nextStatus) throw new AppError('Invalid target stage for progression', 400)

    const updated = await prisma.$transaction(async (tx) => {
      const updatePromises = applications.map(app => {
        const existingHistory = Array.isArray(app.stageHistory) ? app.stageHistory : []
        const stageHistory = [
          ...existingHistory,
          {
            fromStage: previousStage,
            toStage: targetStage,
            fromStatus: null,
            toStatus: nextStatus,
            movedAt: new Date().toISOString(),
            movedBy: currentUser.id
          }
        ]

        return tx.application.update({
          where: { id: app.id },
          data: {
            currentStage: targetStage,
            status: nextStatus,
            selectedAt: targetStage === 'FINAL' ? new Date() : undefined,
            stageHistory
          },
          select: { id: true }
        })
      })

      const updatedRows = await Promise.all(updatePromises)
      return updatedRows.length
    })

    return { updated }
  }

  async rejectApplications({ driveId, applicationIds, currentUser }) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { id: true, companyId: true, isLocked: true }
    })
    if (!drive) throw new AppError('Drive not found', 404)
    if (drive.isLocked) throw new AppError('Drive already locked', 400)

    if (currentUser.role === 'COMPANY') {
      const company = await prisma.company.findUnique({ where: { userId: currentUser.id }, select: { id: true } })
      if (!company || company.id !== drive.companyId) {
        throw new AppError('Unauthorized access', 403)
      }
    } else if (currentUser.role !== 'ADMIN') {
      throw new AppError('Unauthorized access', 403)
    }

    const existing = await prisma.application.findMany({
      where: { id: { in: applicationIds }, driveId },
      select: { id: true, stageHistory: true }
    })
    if (existing.length === 0) throw new AppError('No applications found to reject', 400)

    const rejected = await prisma.$transaction(async (tx) => {
      const updates = existing.map(app => {
        const history = Array.isArray(app.stageHistory) ? app.stageHistory : []
        return tx.application.update({
          where: { id: app.id },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            stageHistory: [
              ...history,
              {
                action: 'REJECTED',
                atStage: null,
                movedAt: new Date().toISOString(),
                movedBy: currentUser.id
              }
            ]
          },
          select: { id: true }
        })
      })

      const rows = await Promise.all(updates)
      return rows.length
    })

    return { rejected }
  }

  async completeCurrentStage({ driveId, currentUser }) {
    const drive = await this._validateDriveAccess({ driveId, currentUser, allowCompanyOwner: true, allowCollegeAccess: true })
    await this._validateManagedByForDriveAction({ driveId, currentUser, allowCompany: true })
    if (drive.isLocked) throw new AppError('Drive already locked', 400)

    const activeStage = await prisma.stage.findFirst({
      where: { driveId, status: 'ACTIVE' },
      orderBy: { order: 'asc' }
    })
    if (!activeStage) throw new AppError('No active stage found', 400)
    if (activeStage.status === 'COMPLETED') throw new AppError('Stage already completed', 400)

    const hasProcessed = await prisma.application.count({
      where: {
        driveId,
        currentStage: activeStage.name
      }
    })

    if (activeStage.name !== 'APPLICATIONS' && hasProcessed === 0) {
      throw new AppError('No applications processed in active stage', 400)
    }

    const result = await prisma.$transaction(async (tx) => {
      const stage = await tx.stage.update({
        where: { id: activeStage.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      let updatedDrive = null
      if (activeStage.name === 'FINAL') {
        updatedDrive = await tx.drive.update({
          where: { id: driveId },
          data: {
            isLocked: true,
            lockedAt: new Date(),
            status: 'CLOSED'
          }
        })
      }

      return { stage, drive: updatedDrive }
    })

    return result
  }

  async getDriveStageProgress({ driveId, currentUser }) {
    await this._validateDriveAccess({ driveId, currentUser, allowCompanyOwner: true, allowCollegeAccess: true })

    const [stages, counts] = await Promise.all([
      prisma.stage.findMany({
        where: { driveId },
        orderBy: { order: 'asc' },
        select: {
          name: true,
          status: true,
          order: true,
          startedAt: true,
          completedAt: true
        }
      }),
      prisma.application.groupBy({
        by: ['currentStage'],
        where: { driveId },
        _count: { _all: true }
      })
    ])

    const applicationCounts = STAGE_FLOW.reduce((acc, stage) => {
      acc[stage] = 0
      return acc
    }, {})

    counts.forEach(c => {
      applicationCounts[c.currentStage] = c._count._all
    })

    const active = stages.find(s => s.status === 'ACTIVE')
    const completion = active
      ? Math.round((active.order / STAGE_FLOW.length) * 100)
      : Math.round((stages.filter(s => s.status === 'COMPLETED').length / STAGE_FLOW.length) * 100)

    return {
      stages,
      applicationCounts,
      completion
    }
  }

  async validateStageTransition({ driveId, fromStage, toStage }) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { id: true, currentStage: true }
    })
    if (!drive) throw new AppError('Drive not found', 404)

    const fromOrder = STAGE_ORDER[fromStage]
    const toOrder = STAGE_ORDER[toStage]

    if (!fromOrder || !toOrder) throw new AppError('Invalid stage transition', 400)
    if (drive.currentStage !== fromStage) throw new AppError('From stage is not current active stage', 400)
    if (toOrder !== fromOrder + 1) throw new AppError('Invalid stage transition: must move sequentially', 400)

    return {
      valid: true,
      fromStage,
      toStage
    }
  }

  async getApplicationsByStage({ driveId, stage, collegeId, currentUser, pagination = {} }) {
    await this._validateDriveAccess({ driveId, currentUser, allowCompanyOwner: true, allowCollegeAccess: true })

    const page = Math.max(parseInt(pagination.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(pagination.limit, 10) || 20, 1), 100)
    const skip = (page - 1) * limit

    const where = { driveId, currentStage: stage }

    if (currentUser.role === 'COLLEGE') {
      const college = await prisma.college.findUnique({ where: { userId: currentUser.id }, select: { id: true } })
      if (!college) throw new AppError('College not found', 404)
      where.collegeId = college.id
    } else if (collegeId) {
      where.collegeId = collegeId
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          driveId: true,
          studentId: true,
          collegeId: true,
          status: true,
          currentStage: true,
          appliedAt: true,
          updatedAt: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              cgpa: true
            }
          },
          college: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
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

  async _validateDriveAccess({ driveId, currentUser, allowCompanyOwner = false, allowCollegeAccess = false }) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { id: true, companyId: true, currentStage: true, isLocked: true }
    })

    if (!drive) throw new AppError('Drive not found', 404)

    if (currentUser.role === 'COMPANY') {
      if (!allowCompanyOwner) throw new AppError('Unauthorized access', 403)
      const company = await prisma.company.findUnique({ where: { userId: currentUser.id }, select: { id: true } })
      if (!company || company.id !== drive.companyId) {
        throw new AppError('Unauthorized access', 403)
      }
      return drive
    }

    if (currentUser.role === 'COLLEGE') {
      if (!allowCollegeAccess) throw new AppError('Unauthorized access', 403)
      const college = await prisma.college.findUnique({ where: { userId: currentUser.id }, select: { id: true } })
      if (!college) throw new AppError('College profile not found', 404)
      const dc = await prisma.driveCollege.findUnique({
        where: { driveId_collegeId: { driveId, collegeId: college.id } },
        select: { invitationStatus: true }
      })
      if (!dc || dc.invitationStatus !== 'ACCEPTED') {
        throw new AppError('Unauthorized access', 403)
      }
      return drive
    }

    if (currentUser.role === 'ADMIN') {
      return drive
    }

    throw new AppError('Unauthorized access', 403)
  }

  _validateManagedByActor({ managedBy, currentUser, collegeUserId }) {
    if (!managedBy) {
      throw new AppError('Drive management not set', 400)
    }

    if (managedBy === 'ADMIN') {
      if (currentUser.role !== 'ADMIN') {
        throw new AppError('Only admin can process this drive stage', 403)
      }
      return
    }

    if (managedBy === 'COLLEGE') {
      if (currentUser.role !== 'COLLEGE' || currentUser.id !== collegeUserId) {
        throw new AppError('Only owning college can process this drive stage', 403)
      }
      return
    }

    throw new AppError('Invalid managedBy configuration', 400)
  }

  async _validateManagedByForDriveAction({ driveId, currentUser, allowCompany = false }) {
    const acceptedMappings = await prisma.driveCollege.findMany({
      where: {
        driveId,
        invitationStatus: 'ACCEPTED'
      },
      select: {
        managedBy: true,
        college: {
          select: { userId: true }
        }
      }
    })

    if (acceptedMappings.length === 0) {
      throw new AppError('No accepted drive-college mappings found', 400)
    }

    if (allowCompany && currentUser.role === 'COMPANY') {
      return true
    }

    if (currentUser.role === 'ADMIN') {
      const hasAdminManaged = acceptedMappings.some(m => m.managedBy === 'ADMIN')
      if (!hasAdminManaged) {
        throw new AppError('No admin-managed college flow for this drive', 403)
      }
      return true
    }

    if (currentUser.role === 'COLLEGE') {
      const allowedCollege = acceptedMappings.some(
        m => m.managedBy === 'COLLEGE' && m.college && m.college.userId === currentUser.id
      )
      if (!allowedCollege) {
        throw new AppError('Only managed college can perform this action', 403)
      }
      return true
    }

    throw new AppError('Unauthorized access', 403)
  }
}

module.exports = new StageService()
