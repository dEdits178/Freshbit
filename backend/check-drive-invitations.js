const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDriveInvitations() {
  try {
    console.log('=== CHECKING DRIVE INVITATIONS ===');
    
    const driveColleges = await prisma.driveCollege.findMany({
      where: { driveId: 'test-drive-1' },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    console.log('Colleges invited to test-drive-1:');
    driveColleges.forEach(dc => {
      console.log(`- ${dc.college.name} (${dc.college.user.email}) - Status: ${dc.invitationStatus}`);
    });

    // Get all colleges
    const allColleges = await prisma.college.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    console.log('\nAll colleges in system:');
    allColleges.forEach(college => {
      console.log(`- ${college.name} (${college.user.email})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDriveInvitations();
