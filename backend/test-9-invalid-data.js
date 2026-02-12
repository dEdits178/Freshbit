const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testInvalidData() {
  try {
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

    console.log('=== TEST 9: INVALID DATA TEST ===');

    // Test data with invalid data
    const testData = {
      students: [
        {
          firstName: "",
          email: "invalid-email"
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
        
        if (res.statusCode === 400) {
          console.log('✅ TEST 9 PASSED: Invalid data rejected with validation error');
        } else {
          console.log('❌ TEST 9 FAILED: Expected 400 validation error for invalid data');
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

testInvalidData();
