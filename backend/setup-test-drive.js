const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupTestDrive() {
  try {
    // Get the existing data
    const drive = await prisma.drive.findFirst({ where: { id: 'test-drive-1' } })
    const college1 = await prisma.college.findFirst({ where: { name: 'Alpha College' } })
    const college2 = await prisma.college.findFirst({ where: { name: 'Beta College' } })

    if (!drive || !college1 || !college2) {
      console.error('Missing required data')
      return
    }

    // Create drive-college relationships with ACCEPTED status
    await prisma.driveCollege.upsert({
      where: { driveId_collegeId: { driveId: drive.id, collegeId: college1.id } },
      update: { invitationStatus: 'ACCEPTED', managedBy: 'COLLEGE' },
      create: {
        driveId: drive.id,
        collegeId: college1.id,
        invitationStatus: 'ACCEPTED',
        managedBy: 'COLLEGE'
      }
    })

    await prisma.driveCollege.upsert({
      where: { driveId_collegeId: { driveId: drive.id, collegeId: college2.id } },
      update: { invitationStatus: 'ACCEPTED', managedBy: 'COLLEGE' },
      create: {
        driveId: drive.id,
        collegeId: college2.id,
        invitationStatus: 'ACCEPTED',
        managedBy: 'COLLEGE'
      }
    })

    console.log('Test drive setup complete!')
    console.log('Drive ID:', drive.id)
    console.log('College 1 ID:', college1.id, 'User ID:', college1.userId)
    console.log('College 2 ID:', college2.id, 'User ID:', college2.userId)

  } catch (error) {
    console.error('Error setting up test drive:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupTestDrive()
