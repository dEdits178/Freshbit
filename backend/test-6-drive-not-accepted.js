const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testDriveNotAccepted() {
  try {
    // First, let's change the driveCollege status to PENDING for college1
    const college1 = await prisma.college.findFirst({
      where: { name: 'Alpha College' }
    });

    if (!college1) {
      console.error('College1 not found');
      return;
    }

    // Update the driveCollege status to PENDING
    await prisma.driveCollege.update({
      where: {
        driveId_collegeId: {
          driveId: 'test-drive-1',
          collegeId: college1.id
        }
      },
      data: {
        invitationStatus: 'PENDING'
      }
    });

    console.log('Changed driveCollege status to PENDING for testing');

    // Get college user
    const college = await prisma.user.findUnique({
      where: { email: 'college1@freshbit.test' }
    });

    if (!college) {
      console.error('College user not found');
      return;
    }

    // Generate token
    const token = jwt.sign(
      { userId: college.id, role: college.role },
      'your-super-secret-jwt-key-change-this-in-production-minimum-32-chars',
      { expiresIn: '7d' }
    );

    console.log('=== TEST 6: DRIVE NOT ACCEPTED TEST ===');

    // Test data
    const testData = {
      students: [
        {
          firstName: "Test",
          lastName: "Student",
          email: "testpending@test.com",
          phone: "1234567890",
          course: "B.Tech",
          cgpa: 8.0
        }
      ]
    };

    console.log('Test Data:', JSON.stringify(testData, null, 2));

    // Make request using http module
    const postData = JSON.stringify(testData);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/test-drive-1/confirm',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
        
        if (res.statusCode === 403) {
          console.log('✅ TEST 6 PASSED: Drive not accepted blocked');
        } else {
          console.log('❌ TEST 6 FAILED: Expected 403 error');
        }
        
        // Restore the status to ACCEPTED for other tests
        prisma.driveCollege.update({
          where: {
            driveId_collegeId: {
              driveId: 'test-drive-1',
              collegeId: college1.id
            }
          },
          data: {
            invitationStatus: 'ACCEPTED'
          }
        }).then(() => {
          console.log('Restored driveCollege status to ACCEPTED');
          prisma.$disconnect();
        });
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e);
      prisma.$disconnect();
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

testDriveNotAccepted();
