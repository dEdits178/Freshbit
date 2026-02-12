const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testStudentConfirm() {
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

    console.log('Generated token:', token);

    // Test data
    const testData = {
      students: [
        {
          firstName: "Rahul",
          lastName: "Sharma",
          email: "rahul@test.com",
          phone: "9999999999",
          course: "B.Tech",
          cgpa: 8.5
        },
        {
          firstName: "Priya",
          lastName: "Verma",
          email: "priya@test.com",
          phone: "8888888888",
          course: "B.Tech",
          cgpa: 9.1
        }
      ]
    };

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

testStudentConfirm();
