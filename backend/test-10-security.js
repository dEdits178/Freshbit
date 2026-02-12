const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testSecurityScenarios() {
  try {
    console.log('=== TEST 10: SECURITY SCENARIOS ===');

    // Test 10a: No Authorization header
    console.log('\n--- Test 10a: No Authorization header ---');
    
    const testData = {
      students: [
        {
          firstName: "Security",
          lastName: "Test",
          email: "security@test.com",
          phone: "1234567890",
          course: "B.Tech",
          cgpa: 8.0
        }
      ]
    };

    const postData = JSON.stringify(testData);

    const optionsNoAuth = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/test-drive-1/confirm',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const reqNoAuth = http.request(optionsNoAuth, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('No Auth - Status Code:', res.statusCode);
        console.log('No Auth - Response:', data);
        
        if (res.statusCode === 401) {
          console.log('✅ TEST 10a PASSED: No auth header blocked');
        } else {
          console.log('❌ TEST 10a FAILED: Expected 401 error');
        }

        // Test invalid token
        testInvalidToken();
      });
    });

    reqNoAuth.on('error', (e) => {
      console.error('No auth request error:', e);
      testInvalidToken();
    });

    reqNoAuth.write(postData);
    reqNoAuth.end();

    function testInvalidToken() {
      console.log('\n--- Test 10b: Invalid token ---');

      const optionsInvalidToken = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/students/test-drive-1/confirm',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token-here',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const reqInvalidToken = http.request(optionsInvalidToken, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log('Invalid Token - Status Code:', res.statusCode);
          console.log('Invalid Token - Response:', data);
          
          if (res.statusCode === 401) {
            console.log('✅ TEST 10b PASSED: Invalid token blocked');
          } else {
            console.log('❌ TEST 10b FAILED: Expected 401 error for invalid token');
          }
        });
      });

      reqInvalidToken.on('error', (e) => {
        console.error('Invalid token request error:', e);
      });

      reqInvalidToken.write(postData);
      reqInvalidToken.end();
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSecurityScenarios();
