const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testDuplicateInSameFileNew() {
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

    console.log('=== TEST 2: DUPLICATE INSIDE SAME FILE (NEW EMAILS) ===');

    // Test data with duplicate emails (new emails not in DB)
    const testData = {
      students: [
        {
          firstName: "Alice",
          lastName: "Smith",
          email: "alice@newtest.com"
        },
        {
          firstName: "Alice2",
          lastName: "Smith2",
          email: "alice@newtest.com"  // Same email as above
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
        
        const response = JSON.parse(data);
        if (response.success && response.data.totalUploaded === 1 && response.data.inserted === 1 && response.data.linked === 1) {
          console.log('✅ TEST 2 PASSED: Only 1 student inserted/linked despite 2 in input');
        } else {
          console.log('❌ TEST 2 FAILED: Expected 1 totalUploaded, 1 inserted, 1 linked');
          console.log('Got:', response.data);
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

testDuplicateInSameFileNew();
