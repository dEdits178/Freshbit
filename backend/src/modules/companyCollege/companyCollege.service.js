const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

const STAGE_FLOW = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL']

class CompanyCollegeService {
  // Get all approved colleges (for browsing/inviting)
  async getColleges(companyUserId, { search, page, limit }) {
    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    // Build where clause
    const where = {
      approved: true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.college.count({ where })

    // Get colleges with pagination
    const colleges = await prisma.college.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        tier: true,
        approved: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return {
      colleges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  // Get invited colleges for a specific drive
  async getDriveColleges(companyUserId, driveId) {
    // Verify company exists and owns the drive
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    // Verify drive belongs to company
    const drive = await prisma.drive.findFirst({
      where: {
        id: driveId,
        companyId: company.id
      }
    })

    if (!drive) {
      throw new AppError('Drive not found or access denied', 404)
    }

    // Get all invited colleges with their status and application counts
    const driveColleges = await prisma.driveCollege.findMany({
      where: { driveId },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            tier: true
          }
        },
        // Get application counts per stage for each college
        applications: {
          select: {
            status: true,
            currentStage: true
          }
        },
        // Get stage progress
        stageProgress: {
          orderBy: { order: 'asc' }
        },
        // Get upload logs count
        uploadLogs: {
          select: { id: true, stage: true }
        }
      }
    })

    // Transform data to include counts
    const result = driveColleges.map(dc => {
      const applications = dc.applications || []
      const stageProgress = dc.stageProgress || []
      
      return {
        id: dc.id,
        invitationStatus: dc.invitationStatus,
        managedBy: dc.managedBy,
        startedAt: dc.startedAt,
        isLocked: dc.isLocked,
        completedAt: dc.completedAt,
        currentStage: dc.currentStage,
        college: dc.college,
        // Calculate counts
        applicationCount: applications.filter(a => a.status === 'APPLIED').length,
        testCount: applications.filter(a => a.status === 'IN_TEST').length,
        shortlistCount: applications.filter(a => a.status === 'SHORTLISTED').length,
        interviewCount: applications.filter(a => a.status === 'IN_INTERVIEW').length,
        finalCount: applications.filter(a => a.status === 'SELECTED').length,
        // Stage progress
        stages: stageProgress.map(s => ({
          name: s.name,
          status: s.status,
          order: s.order,
          startedAt: s.startedAt,
          completedAt: s.completedAt
        })),
        // Upload count
        uploadCount: dc.uploadLogs?.length || 0
      }
    })

    return result
  }

  // Get specific college details within a drive
  async getDriveCollegeById(companyUserId, driveId, collegeId) {
    // Verify company exists and owns the drive
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    // Verify drive belongs to company
    const drive = await prisma.drive.findFirst({
      where: {
        id: driveId,
        companyId: company.id
      }
    })

    if (!drive) {
      throw new AppError('Drive not found or access denied', 404)
    }

    // Get drive college with full details
    const driveCollege = await prisma.driveCollege.findUnique({
      where: {
        driveId_collegeId: {
          driveId,
          collegeId
        }
      },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            tier: true
          }
        },
        applications: {
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
          }
        },
        stageProgress: {
          orderBy: { order: 'asc' }
        },
        uploadLogs: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    })

    if (!driveCollege) {
      throw new AppError('College not found in this drive', 404)
    }

    // Calculate statistics
    const applications = driveCollege.applications || []
    const stageProgress = driveCollege.stageProgress || []
    const uploadLogs = driveCollege.uploadLogs || []

    return {
      id: driveCollege.id,
      invitationStatus: driveCollege.invitationStatus,
      managedBy: driveCollege.managedBy,
      startedAt: driveCollege.startedAt,
      isLocked: driveCollege.isLocked,
      completedAt: driveCollege.completedAt,
      currentStage: driveCollege.currentStage,
      stageHistory: driveCollege.stageHistory,
      college: driveCollege.college,
      drive: {
        id: drive.id,
        roleTitle: drive.roleTitle,
        salary: drive.salary,
        description: drive.description,
        status: drive.status
      },
      // Statistics
      stats: {
        totalApplications: applications.length,
        applicationsCount: applications.filter(a => a.status === 'APPLIED').length,
        testCount: applications.filter(a => a.status === 'IN_TEST').length,
        shortlistCount: applications.filter(a => a.status === 'SHORTLISTED').length,
        interviewCount: applications.filter(a => a.status === 'IN_INTERVIEW').length,
        selectedCount: applications.filter(a => a.status === 'SELECTED').length,
        rejectedCount: applications.filter(a => a.status === 'REJECTED').length
      },
      // Stage progress
      stages: stageProgress.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        order: s.order,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        completedBy: s.completedBy
      })),
      // Students by stage
      students: {
        applied: applications.filter(a => a.status === 'APPLIED').map(a => a.student),
        inTest: applications.filter(a => a.status === 'IN_TEST').map(a => a.student),
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').map(a => a.student),
        inInterview: applications.filter(a => a.status === 'IN_INTERVIEW').map(a => a.student),
        selected: applications.filter(a => a.status === 'SELECTED').map(a => a.student),
        rejected: applications.filter(a => a.status === 'REJECTED').map(a => a.student)
      },
      // Upload logs
      uploads: uploadLogs.map(u => ({
        id: u.id,
        stage: u.stage,
        fileName: u.fileName,
        fileType: u.fileType,
        totalRecords: u.totalRecords,
        validRecords: u.validRecords,
        invalidRecords: u.invalidRecords,
        uploadedBy: u.uploadedBy,
        uploadedAt: u.uploadedAt
      }))
    }
  }

  // Invite colleges to a drive
  async inviteColleges(companyUserId, driveId, collegeIds, managedBy) {
    // Verify company exists and owns the drive
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    // Verify drive belongs to company
    const drive = await prisma.drive.findFirst({
      where: {
        id: driveId,
        companyId: company.id
      }
    })

    if (!drive) {
      throw new AppError('Drive not found or access denied', 404)
    }

    // Verify all colleges exist
    const colleges = await prisma.college.findMany({
      where: {
        id: { in: collegeIds },
        approved: true
      }
    })

    if (colleges.length !== collegeIds.length) {
      throw new AppError('One or more colleges not found or not approved', 404)
    }

    // Check which colleges are already invited
    const existingInvitations = await prisma.driveCollege.findMany({
      where: {
        driveId,
        collegeId: { in: collegeIds }
      }
    })

    const existingCollegeIds = new Set(existingInvitations.map(i => i.collegeId))
    const newCollegeIds = collegeIds.filter(id => !existingCollegeIds.has(id))

    if (newCollegeIds.length === 0) {
      throw new AppError('All these colleges are already invited to this drive', 400)
    }

    // Create new invitations with stage progress in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create DriveCollege records
      const driveColleges = await tx.driveCollege.createManyAndReturn({
        data: newCollegeIds.map(collegeId => ({
          driveId,
          collegeId,
          invitationStatus: 'PENDING',
          managedBy: null,
          startedAt: null,
          currentStage: 'APPLICATIONS'
        }))
      })

      // Initialize stage progress for each new DriveCollege
      for (const dc of driveColleges) {
        await tx.driveCollegeStage.createMany({
          data: STAGE_FLOW.map((name, index) => ({
            driveCollegeId: dc.id,
            name,
            order: index + 1,
            status: name === 'APPLICATIONS' ? 'ACTIVE' : 'PENDING',
            startedAt: name === 'APPLICATIONS' ? new Date() : null
          }))
        })
      }

      return driveColleges
    })

    // Fetch and return the created invitations with relations
    const createdInvitations = await prisma.driveCollege.findMany({
      where: {
        driveId,
        collegeId: { in: newCollegeIds }
      },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        }
      }
    })

    return createdInvitations
  }

  // Update college invitation status in a drive
  async updateCollegeStatus(companyUserId, driveId, collegeId, status, managedBy) {
    // Verify company exists and owns the drive
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    // Verify drive belongs to company
    const drive = await prisma.drive.findFirst({
      where: {
        id: driveId,
        companyId: company.id
      }
    })

    if (!drive) {
      throw new AppError('Drive not found or access denied', 404)
    }

    // Check if drive college exists
    const driveCollege = await prisma.driveCollege.findUnique({
      where: {
        driveId_collegeId: {
          driveId,
          collegeId
        }
      }
    })

    if (!driveCollege) {
      throw new AppError('College not found in this drive', 404)
    }

    // Update the status
    const updateData = {}
    if (status) {
      updateData.invitationStatus = status
    }
    if (managedBy) {
      updateData.managedBy = managedBy
    }
    if (status === 'ACCEPTED' && !driveCollege.startedAt) {
      updateData.startedAt = new Date()
    }

    const updated = await prisma.driveCollege.update({
      where: {
        driveId_collegeId: {
          driveId,
          collegeId
        }
      },
      data: updateData,
      include: {
        college: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        }
      }
    })

    return updated
  }

  // Get selections for a drive (optionally filtered by collegeId)
  async getSelections(companyUserId, driveId, collegeId) {
    // Verify company exists and owns the drive
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    // Verify drive belongs to company
    const drive = await prisma.drive.findFirst({
      where: {
        id: driveId,
        companyId: company.id
      }
    })

    if (!drive) {
      throw new AppError('Drive not found or access denied', 404)
    }

    // Build application query
    const where = { driveId }
    if (collegeId) {
      where.collegeId = collegeId
    }

    // Get selected students
    const applications = await prisma.application.findMany({
      where,
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
      }
    })

    // Group by college if no specific collegeId provided
    if (!collegeId) {
      const byCollege = {}
      applications.forEach(app => {
        const cid = app.collegeId
        if (!byCollege[cid]) {
          byCollege[cid] = {
            college: app.college,
            students: []
          }
        }
        if (app.status === 'SELECTED') {
          byCollege[cid].students.push({
            ...app.student,
            status: app.status,
            selectedAt: app.selectedAt
          })
        }
      })
      return byCollege
    }

    // Return flat list if specific college requested
    return {
      college: applications[0]?.college,
      students: applications
        .filter(app => app.status === 'SELECTED')
        .map(app => ({
          ...app.student,
          status: app.status,
          selectedAt: app.selectedAt
        }))
    }
  }

  // Get stage progress for a specific college in a drive
  async getCollegeStageProgress(companyUserId, driveId, collegeId) {
    // Verify company exists and owns the drive
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    // Verify drive belongs to company
    const drive = await prisma.drive.findFirst({
      where: {
        id: driveId,
        companyId: company.id
      }
    })

    if (!drive) {
      throw new AppError('Drive not found or access denied', 404)
    }

    // Get drive college with stage progress
    const driveCollege = await prisma.driveCollege.findUnique({
      where: {
        driveId_collegeId: {
          driveId,
          collegeId
        }
      },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        },
        stageProgress: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!driveCollege) {
      throw new AppError('College not found in this drive', 404)
    }

    return {
      driveCollegeId: driveCollege.id,
      currentStage: driveCollege.currentStage,
      isLocked: driveCollege.isLocked,
      completedAt: driveCollege.completedAt,
      college: driveCollege.college,
      stages: driveCollege.stageProgress.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        order: s.order,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        completedBy: s.completedBy
      }))
    }
  }

  // Get upload logs for a specific college in a drive
  async getCollegeUploads(companyUserId, driveId, collegeId) {
    // Verify company exists and owns the drive
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    // Verify drive belongs to company
    const drive = await prisma.drive.findFirst({
      where: {
        id: driveId,
        companyId: company.id
      }
    })

    if (!drive) {
      throw new AppError('Drive not found or access denied', 404)
    }

    // Verify drive college exists
    const driveCollege = await prisma.driveCollege.findUnique({
      where: {
        driveId_collegeId: {
          driveId,
          collegeId
        }
      }
    })

    if (!driveCollege) {
      throw new AppError('College not found in this drive', 404)
    }

    // Get upload logs
    const uploadLogs = await prisma.driveCollegeUpload.findMany({
      where: {
        driveCollegeId: driveCollege.id
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return uploadLogs
  }
}

module.exports = new CompanyCollegeService()
