const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

const STAGE_FLOW = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL']

class DriveService {
  async createDrive(companyUserId, { roleTitle, salary, description, collegeIds }) {
    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    // Verify all colleges exist
    const colleges = await prisma.college.findMany({
      where: {
        id: { in: collegeIds }
      }
    })

    if (colleges.length !== collegeIds.length) {
      throw new AppError('One or more colleges not found', 404)
    }

    // Create drive with colleges and stages in transaction
    const drive = await prisma.$transaction(async (tx) => {
      // 1. Create the drive
      const newDrive = await tx.drive.create({
        data: {
          companyId: company.id,
          roleTitle,
          salary: parseInt(salary),
          description,
          status: 'DRAFT',
          currentStage: 'APPLICATIONS'
        }
      })

      // 2. Create DriveCollege records with invitation status
      await tx.driveCollege.createMany({
        data: collegeIds.map(collegeId => ({
          driveId: newDrive.id,
          collegeId,
          invitationStatus: 'PENDING',
          managedBy: null,
          startedAt: null
        }))
      })

      // 3. Initialize Drive stages (single timeline per drive)
      await tx.stage.createMany({
        data: STAGE_FLOW.map((name, index) => ({
          driveId: newDrive.id,
          name,
          order: index + 1,
          status: name === 'APPLICATIONS' ? 'ACTIVE' : 'PENDING',
          startedAt: name === 'APPLICATIONS' ? new Date() : null
        }))
      })

      // 4. Fetch complete drive with relations
      return await tx.drive.findUnique({
        where: { id: newDrive.id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              domain: true
            }
          },
          driveColleges: {
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
          },
          stages: {
            select: {
              id: true,
              name: true,
              order: true,
              status: true,
              startedAt: true,
              completedAt: true
            },
            orderBy: { order: 'asc' }
          }
        }
      })
    })

    return drive
  }

  async publishDrive(companyUserId, driveId) {
    // Verify drive exists and belongs to company
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      include: {
        company: true
      }
    })

    if (!drive) {
      throw new AppError('Drive not found', 404)
    }

    if (drive.company.userId !== companyUserId) {
      throw new AppError('You do not have permission to publish this drive', 403)
    }

    if (drive.status === 'PUBLISHED') {
      throw new AppError('Drive is already published', 400)
    }

    // Publish drive - stages will be activated when colleges accept invitations
    const updatedDrive = await prisma.drive.update({
      where: { id: driveId },
      data: { status: 'PUBLISHED' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        driveColleges: {
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
        },
        stages: {
          select: {
            id: true,
            name: true,
            order: true,
            status: true,
            startedAt: true,
            completedAt: true
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    return updatedDrive
  }

  async getCompanyDrives(companyUserId) {
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    const drives = await prisma.drive.findMany({
      where: { companyId: company.id },
      include: {
        driveColleges: {
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
        },
        stages: {
          select: {
            name: true,
            order: true,
            status: true,
            startedAt: true,
            completedAt: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return drives
  }

  async getDriveById(companyUserId, driveId) {
    const company = await prisma.company.findUnique({
      where: { userId: companyUserId }
    })

    if (!company) {
      throw new AppError('Company profile not found', 404)
    }

    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        driveColleges: {
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
        },
        stages: {
          select: {
            id: true,
            name: true,
            order: true,
            status: true,
            startedAt: true,
            completedAt: true
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!drive) {
      throw new AppError('Drive not found', 404)
    }

    if (drive.companyId !== company.id) {
      throw new AppError('You do not have permission to view this drive', 403)
    }

    return drive
  }

  async respondToDrive(collegeUserId, driveId, action) {
    // Verify college exists
    const college = await prisma.college.findUnique({
      where: { userId: collegeUserId }
    })

    if (!college) {
      throw new AppError('College profile not found', 404)
    }

    // Verify drive exists
    const drive = await prisma.drive.findUnique({
      where: { id: driveId }
    })

    if (!drive) {
      throw new AppError('Drive not found', 404)
    }

    // Verify DriveCollege exists for this college
    const driveCollege = await prisma.driveCollege.findUnique({
      where: {
        driveId_collegeId: {
          driveId,
          collegeId: college.id
        }
      }
    })

    if (!driveCollege) {
      throw new AppError('Drive invitation not found for your college', 404)
    }

    // Safety rules
    if (driveCollege.invitationStatus === 'ACCEPTED') {
      throw new AppError('Drive has already been accepted', 400)
    }

    if (driveCollege.invitationStatus === 'REJECTED') {
      throw new AppError('Drive has already been rejected', 400)
    }

    let updatedDriveCollege

    await prisma.$transaction(async (tx) => {
      if (action === 'ACCEPT') {
        // Accept the drive
        updatedDriveCollege = await tx.driveCollege.update({
          where: {
            driveId_collegeId: {
              driveId,
              collegeId: college.id
            }
          },
          data: {
            invitationStatus: 'ACCEPTED',
            managedBy: 'COLLEGE',
            startedAt: new Date()
          }
        })

      } else if (action === 'REJECT') {
        // Reject the drive
        updatedDriveCollege = await tx.driveCollege.update({
          where: {
            driveId_collegeId: {
              driveId,
              collegeId: college.id
            }
          },
          data: {
            invitationStatus: 'REJECTED'
          }
        })
      } else {
        throw new AppError('Invalid action. Must be ACCEPT or REJECT', 400)
      }
    })

    // Return updated record with relations
    return await prisma.driveCollege.findUnique({
      where: {
        driveId_collegeId: {
          driveId,
          collegeId: college.id
        }
      },
      include: {
        drive: {
          select: {
            id: true,
            roleTitle: true,
            salary: true,
            description: true,
            status: true
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
  }

  async adminOverrideDrive(driveId, collegeId, action) {
    // Verify DriveCollege exists
    const driveCollege = await prisma.driveCollege.findUnique({
      where: {
        driveId_collegeId: {
          driveId,
          collegeId
        }
      }
    })

    if (!driveCollege) {
      throw new AppError('Drive invitation not found', 404)
    }

    let updatedDriveCollege

    await prisma.$transaction(async (tx) => {
      if (action === 'FORCE_ACCEPT') {
        // Force accept the drive
        updatedDriveCollege = await tx.driveCollege.update({
          where: {
            driveId_collegeId: {
              driveId,
              collegeId
            }
          },
          data: {
            invitationStatus: 'ACCEPTED',
            managedBy: 'ADMIN',
            startedAt: new Date()
          }
        })

      } else if (action === 'REJECT') {
        // Reject the drive
        updatedDriveCollege = await tx.driveCollege.update({
          where: {
            driveId_collegeId: {
              driveId,
              collegeId
            }
          },
          data: {
            invitationStatus: 'REJECTED'
          }
        })
      } else {
        throw new AppError('Invalid action. Must be FORCE_ACCEPT or REJECT', 400)
      }
    })

    // Return updated record with relations
    return await prisma.driveCollege.findUnique({
      where: {
        driveId_collegeId: {
          driveId,
          collegeId
        }
      },
      include: {
        drive: {
          select: {
            id: true,
            roleTitle: true,
            salary: true,
            description: true,
            status: true
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
  }
}

module.exports = new DriveService()
