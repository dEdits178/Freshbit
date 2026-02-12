const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testUnauthorizedCollege() {
  try {
    // Get a college that's NOT invited to the drive
    const college = await prisma.user.findUnique({
      where: { email: 'college@test.com' }
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

    console.log('=== TEST 5: UNAUTHORIZED COLLEGE TEST ===');
    console.log('Using college@test.com (not invited to test-drive-1)');

    // Test data
    const testData = {
      students: [
        {
          firstName: "Unauthorized",
          lastName: "Student",
          email: "unauthorized@test.com",
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
        
        if (res.statusCode === 404 || res.statusCode === 403) {
          console.log('✅ TEST 5 PASSED: Unauthorized college access blocked');
        } else {
          console.log('❌ TEST 5 FAILED: Expected 403 or 404 error');
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUnauthorizedCollege();
