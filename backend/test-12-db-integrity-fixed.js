const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDatabaseIntegrity() {
  try {
    console.log('=== TEST 12: DATABASE INTEGRITY VERIFICATION ===');

    // Check Student table
    const studentCount = await prisma.student.count();
    const students = await prisma.student.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        collegeId: true
      },
      orderBy: { email: 'asc' }
    });

    console.log('\n--- Student Table Analysis ---');
    console.log(`Total students in database: ${studentCount}`);
    console.log('Sample students:');
    students.slice(0, 10).forEach(student => {
      console.log(`- ${student.firstName} ${student.lastName} (${student.email}) - College: ${student.collegeId}`);
    });

    // Check DriveStudent table
    const driveStudentCount = await prisma.driveStudent.count();
    const driveStudents = await prisma.driveStudent.findMany({
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        drive: {
          select: {
            roleTitle: true
          }
        }
      },
      orderBy: { student: { email: 'asc' } }
    });

    console.log('\n--- DriveStudent Table Analysis ---');
    console.log(`Total drive-student relationships: ${driveStudentCount}`);
    console.log('Sample drive-student relationships:');
    driveStudents.slice(0, 10).forEach(ds => {
      console.log(`- ${ds.student.firstName} ${ds.student.lastName} (${ds.student.email}) -> ${ds.drive.roleTitle}`);
    });

    // Check for duplicates using Prisma queries
    console.log('\n--- Duplicate Analysis ---');
    
    // Check duplicate emails within same college
    const allStudents = await prisma.student.findMany({
      select: {
        email: true,
        collegeId: true
      }
    });

    const emailCollegeMap = new Map();
    let duplicateCount = 0;

    allStudents.forEach(student => {
      const key = `${student.email}_${student.collegeId}`;
      if (emailCollegeMap.has(key)) {
        duplicateCount++;
      } else {
        emailCollegeMap.set(key, true);
      }
    });

    if (duplicateCount === 0) {
      console.log('✅ No duplicate emails found within colleges');
    } else {
      console.log(`❌ Found ${duplicateCount} duplicate email-college combinations`);
    }

    // Check duplicate drive-student relationships
    const allDriveStudents = await prisma.driveStudent.findMany({
      select: {
        driveId: true,
        studentId: true
      }
    });

    const driveStudentMap = new Map();
    let duplicateDriveStudentCount = 0;

    allDriveStudents.forEach(ds => {
      const key = `${ds.driveId}_${ds.studentId}`;
      if (driveStudentMap.has(key)) {
        duplicateDriveStudentCount++;
      } else {
        driveStudentMap.set(key, true);
      }
    });

    if (duplicateDriveStudentCount === 0) {
      console.log('✅ No duplicate drive-student relationships found');
    } else {
      console.log(`❌ Found ${duplicateDriveStudentCount} duplicate drive-student relationships`);
    }

    // Verify specific test data
    console.log('\n--- Test Data Verification ---');
    
    const testStudents = await prisma.student.findMany({
      where: {
        OR: [
          { email: 'rahul@test.com' },
          { email: 'priya@test.com' },
          { email: 'alice@newtest.com' }
        ]
      }
    });

    console.log('Test students found:', testStudents.length);
    testStudents.forEach(student => {
      console.log(`- ${student.firstName} ${student.lastName} (${student.email})`);
    });

    const testDriveStudents = await prisma.driveStudent.findMany({
      where: {
        driveId: 'test-drive-1',
        student: {
          OR: [
            { email: 'rahul@test.com' },
            { email: 'priya@test.com' },
            { email: 'alice@newtest.com' }
          ]
        }
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('Test drive-student relationships found:', testDriveStudents.length);
    testDriveStudents.forEach(ds => {
      console.log(`- ${ds.student.firstName} ${ds.student.lastName} (${ds.student.email}) -> test-drive-1`);
    });

    // Summary
    console.log('\n=== DATABASE INTEGRITY SUMMARY ===');
    console.log(`✅ Students inserted: ${studentCount}`);
    console.log(`✅ Drive-student relationships: ${driveStudentCount}`);
    console.log(`✅ No duplicate emails: ${duplicateCount === 0}`);
    console.log(`✅ No duplicate drive-student relationships: ${duplicateDriveStudentCount === 0}`);
    console.log(`✅ Test data integrity: ${testStudents.length > 0 && testDriveStudents.length > 0}`);

    const allChecksPass = duplicateCount === 0 && 
                          duplicateDriveStudentCount === 0 && 
                          testStudents.length > 0 && 
                          testDriveStudents.length > 0;

    if (allChecksPass) {
      console.log('\n🎉 ALL DATABASE INTEGRITY CHECKS PASSED!');
    } else {
      console.log('\n❌ Some database integrity checks failed');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabaseIntegrity();
