const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupApplicationTestData() {
  try {
    console.log('=== SETTING UP APPLICATION TEST DATA ===');

    // Get test drive and college
    const drive = await prisma.drive.findFirst({ where: { status: 'PUBLISHED' } });
    const testCollege = await prisma.college.findFirst({ where: { id: '3cf0a2c6-9bf3-4acf-9201-9e3b74230873' } });

    if (!drive || !testCollege) {
      console.error('Test drive or college not found');
      return;
    }

    console.log(`Using Drive: ${drive.id}`);
    console.log(`Using College: ${testCollege.id}`);

    // Create test students
    const students = [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@alpha.edu',
        phone: '+91 9876543210',
        course: 'Computer Engineering',
        cgpa: 8.5,
        collegeId: testCollege.id
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@alpha.edu',
        phone: '+91 9876543211',
        course: 'Information Technology',
        cgpa: 7.8,
        collegeId: testCollege.id
      },
      {
        firstName: 'Carol',
        lastName: 'Williams',
        email: 'carol.williams@alpha.edu',
        phone: '+91 9876543212',
        course: 'Electronics Engineering',
        cgpa: 9.1,
        collegeId: testCollege.id
      }
    ];

    // Create students
    const createdStudents = await prisma.student.createMany({
      data: students,
      skipDuplicates: true
    });

    console.log(`Created ${createdStudents.count} students`);

    // Get the created students
    const allStudents = await prisma.student.findMany({
      where: { collegeId: testCollege.id },
      take: 3
    });

    // Link students to drive
    const driveStudents = allStudents.map(student => ({
      driveId: drive.id,
      studentId: student.id,
      collegeId: testCollege.id
    }));

    const linkedStudents = await prisma.driveStudent.createMany({
      data: driveStudents,
      skipDuplicates: true
    });

    console.log(`Linked ${linkedStudents.count} students to drive`);

    // Create drive-college relationship if not exists
    const existingDriveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId: drive.id, collegeId: testCollege.id } }
    });

    if (!existingDriveCollege) {
      await prisma.driveCollege.create({
        data: {
          driveId: drive.id,
          collegeId: testCollege.id,
          invitationStatus: 'ACCEPTED',
          managedBy: 'COLLEGE'
        }
      });
      console.log('Created drive-college relationship');
    } else if (existingDriveCollege.invitationStatus !== 'ACCEPTED') {
      await prisma.driveCollege.update({
        where: { driveId_collegeId: { driveId: drive.id, collegeId: testCollege.id } },
        data: { invitationStatus: 'ACCEPTED' }
      });
      console.log('Updated drive-college relationship to ACCEPTED');
    }

    console.log('\n=== TEST DATA SETUP COMPLETED ===');
    console.log('You can now run: node test-application-engine.js');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupApplicationTestData();
