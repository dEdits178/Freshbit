const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

class CollegeService {
  async getProfile(collegeUserId) {
    const college = await prisma.college.findUnique({
      where: { userId: collegeUserId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            verified: true
          }
        }
      }
    })

    if (!college) {
      throw new AppError('College profile not found', 404)
    }

    return college
  }

  async updateProfile(collegeUserId, { name, city, state, tier }) {
    const college = await prisma.college.findUnique({
      where: { userId: collegeUserId }
    })

    if (!college) {
      throw new AppError('College profile not found', 404)
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (tier !== undefined) updateData.tier = tier

    const updatedCollege = await prisma.college.update({
      where: { userId: collegeUserId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            verified: true
          }
        }
      }
    })

    return updatedCollege
  }

  async getAssignedDrives(collegeUserId) {
    const college = await prisma.college.findUnique({
      where: { userId: collegeUserId }
    })

    if (!college) {
      throw new AppError('College profile not found', 404)
    }

    const driveColleges = await prisma.driveCollege.findMany({
      where: { 
        collegeId: college.id,
        invitationStatus: { not: 'REJECTED' }
      },
      include: {
        drive: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                domain: true
              }
            },
            stages: {
              select: {
                id: true,
                name: true,
                status: true,
                order: true,
                startedAt: true,
                completedAt: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to return drives with stages
    const drives = driveColleges.map(dc => {
      const drive = dc.drive
      
      // Find active stage
      const activeStage = drive.stages.find(s => s.status === 'ACTIVE')
      
      return {
        id: drive.id,
        roleTitle: drive.roleTitle,
        salary: drive.salary,
        description: drive.description,
        status: drive.status,
        company: drive.company,
        currentStage: activeStage ? activeStage.name : drive.currentStage,
        stages: drive.stages,
        invitationStatus: dc.invitationStatus,
        managedBy: dc.managedBy,
        startedAt: dc.startedAt,
        createdAt: drive.createdAt,
        updatedAt: drive.updatedAt
      }
    })

    return drives
  }

  async getDriveDetails(collegeUserId, driveId) {
    const college = await prisma.college.findUnique({
      where: { userId: collegeUserId }
    })

    if (!college) {
      throw new AppError('College profile not found', 404)
    }

    // Check if drive is assigned to this college
    const driveCollege = await prisma.driveCollege.findFirst({
      where: {
        driveId,
        collegeId: college.id,
        invitationStatus: { not: 'REJECTED' }
      },
      include: {
        drive: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                domain: true
              }
            },
            stages: {
              select: {
                id: true,
                name: true,
                order: true,
                status: true,
                startedAt: true,
                completedAt: true,
                updatedAt: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    })

    if (!driveCollege) {
      throw new AppError('Drive not found or not assigned to your college', 404)
    }

    const drive = driveCollege.drive
    const activeStage = drive.stages.find(s => s.status === 'ACTIVE')

    return {
      id: drive.id,
      roleTitle: drive.roleTitle,
      salary: drive.salary,
      description: drive.description,
      status: drive.status,
      jdFileUrl: drive.jdFileUrl,
      company: drive.company,
      currentStage: activeStage ? activeStage.name : drive.currentStage,
      stages: drive.stages,
      invitationStatus: driveCollege.invitationStatus,
      managedBy: driveCollege.managedBy,
      startedAt: driveCollege.startedAt,
      createdAt: drive.createdAt,
      updatedAt: drive.updatedAt
    }
  }
}

module.exports = new CollegeService()
