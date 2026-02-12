const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testFixes() {
  try {
    console.log('=== TESTING FIXES ===');

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

    // Test 1: Empty firstName
    console.log('\n--- Test: Empty firstName ---');
    const testData1 = {
      students: [
        {
          firstName: "",
          lastName: "Test",
          email: "test@example.com"
        }
      ]
    };

    await testRequest('Empty firstName', testData1, token);

    // Test 2: Invalid email
    console.log('\n--- Test: Invalid email ---');
    const testData2 = {
      students: [
        {
          firstName: "Test",
          lastName: "User",
          email: "invalid-email"
        }
      ]
    };

    await testRequest('Invalid email', testData2, token);

    // Test 3: Invalid token
    console.log('\n--- Test: Invalid token ---');
    await testRequest('Invalid token', testData2, 'invalid-token-here');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function testRequest(testName, testData, token) {
  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/students/test-drive-1/confirm',
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`${testName} - Status: ${res.statusCode}`);
        if (res.statusCode >= 400) {
          console.log(`${testName} - ✅ PASSED: Correctly rejected`);
        } else {
          console.log(`${testName} - ❌ FAILED: Should have been rejected`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`${testName} - Request error:`, e);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

testFixes();
