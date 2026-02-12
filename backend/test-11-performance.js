const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testLargeFilePerformance() {
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

    console.log('=== TEST 11: LARGE FILE PERFORMANCE TEST ===');

    // Test with 500 students
    console.log('\n--- Testing with 500 students ---');
    const students500 = [];
    for (let i = 1; i <= 500; i++) {
      students500.push({
        firstName: `Student${i}`,
        lastName: `Test${i}`,
        email: `student${i}@perf500.com`,
        phone: `123456789${i.toString().padStart(3, '0')}`,
        course: "B.Tech",
        cgpa: 7.5 + (i % 10) * 0.1
      });
    }

    const testData500 = { students: students500 };
    console.log(`Generated ${students500.length} students`);

    const startTime500 = Date.now();
    
    const postData500 = JSON.stringify(testData500);

    const options500 = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/test-drive-1/confirm',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData500)
      }
    };

    const req500 = http.request(options500, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime500 = Date.now();
        const duration500 = endTime500 - startTime500;
        
        console.log('500 Students - Status Code:', res.statusCode);
        console.log('500 Students - Duration:', duration500 + 'ms');
        console.log('500 Students - Response:', JSON.parse(data).data);
        
        if (res.statusCode === 200 && duration500 < 10000) { // Less than 10 seconds
          console.log('✅ 500 Students Test PASSED: Fast execution');
        } else {
          console.log('❌ 500 Students Test FAILED: Too slow or error');
        }

        // Test with 1000 students
        test1000Students();
      });
    });

    req500.on('error', (e) => {
      console.error('500 students request error:', e);
      test1000Students();
    });

    req500.write(postData500);
    req500.end();

    function test1000Students() {
      console.log('\n--- Testing with 1000 students ---');
      const students1000 = [];
      for (let i = 1; i <= 1000; i++) {
        students1000.push({
          firstName: `Student${i}`,
          lastName: `Test${i}`,
          email: `student${i}@perf1000.com`,
          phone: `123456789${i.toString().padStart(3, '0')}`,
          course: "B.Tech",
          cgpa: 7.5 + (i % 10) * 0.1
        });
      }

      const testData1000 = { students: students1000 };
      console.log(`Generated ${students1000.length} students`);

      const startTime1000 = Date.now();
      
      const postData1000 = JSON.stringify(testData1000);

      const options1000 = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/students/test-drive-1/confirm',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData1000)
        }
      };

      const req1000 = http.request(options1000, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const endTime1000 = Date.now();
          const duration1000 = endTime1000 - startTime1000;
          
          console.log('1000 Students - Status Code:', res.statusCode);
          console.log('1000 Students - Duration:', duration1000 + 'ms');
          console.log('1000 Students - Response:', JSON.parse(data).data);
          
          if (res.statusCode === 200 && duration1000 < 15000) { // Less than 15 seconds
            console.log('✅ 1000 Students Test PASSED: Fast execution');
          } else {
            console.log('❌ 1000 Students Test FAILED: Too slow or error');
          }
        });
      });

      req1000.on('error', (e) => {
        console.error('1000 students request error:', e);
      });

      req1000.write(postData1000);
      req1000.end();
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLargeFilePerformance();
