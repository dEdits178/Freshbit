const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testManagedByAdmin() {
  try {
    // First, change the driveCollege managedBy to ADMIN for college1
    const college1 = await prisma.college.findFirst({
      where: { name: 'Alpha College' }
    });

    if (!college1) {
      console.error('College1 not found');
      return;
    }

    // Update the driveCollege managedBy to ADMIN
    await prisma.driveCollege.update({
      where: {
        driveId_collegeId: {
          driveId: 'test-drive-1',
          collegeId: college1.id
        }
      },
      data: {
        managedBy: 'ADMIN'
      }
    });

    console.log('Changed driveCollege managedBy to ADMIN for testing');

    // Test 7a: College tries to access ADMIN-managed drive
    console.log('\n=== TEST 7a: COLLEGE tries to access ADMIN-managed drive ===');

    const college = await prisma.user.findUnique({
      where: { email: 'college1@freshbit.test' }
    });

    if (!college) {
      console.error('College user not found');
      return;
    }

    const collegeToken = jwt.sign(
      { userId: college.id, role: college.role },
      'your-super-secret-jwt-key-change-this-in-production-minimum-32-chars',
      { expiresIn: '7d' }
    );

    const testData = {
      students: [
        {
          firstName: "College",
          lastName: "Test",
          email: "collegetest@test.com",
          phone: "1234567890",
          course: "B.Tech",
          cgpa: 8.0
        }
      ]
    };

    // Test with college token
    const postData = JSON.stringify(testData);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/test-drive-1/confirm',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${collegeToken}`,
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
        console.log('College Access - Status Code:', res.statusCode);
        console.log('College Access - Response:', data);
        
        if (res.statusCode === 403) {
          console.log('✅ TEST 7a PASSED: College blocked from ADMIN-managed drive');
        } else {
          console.log('❌ TEST 7a FAILED: Expected 403 error for college access');
        }

        // Now test with admin
        testAdminAccess();
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e);
      testAdminAccess();
    });

    req.write(postData);
    req.end();

    function testAdminAccess() {
      console.log('\n=== TEST 7b: ADMIN accesses ADMIN-managed drive ===');

      // Get admin user
      const admin = prisma.user.findUnique({
        where: { email: 'admin@freshbit.com' }
      });

      admin.then(adminUser => {
        if (!adminUser) {
          console.error('Admin user not found');
          restoreAndExit();
          return;
        }

        const adminToken = jwt.sign(
          { userId: adminUser.id, role: adminUser.role },
          'your-super-secret-jwt-key-change-this-in-production-minimum-32-chars',
          { expiresIn: '7d' }
        );

        const adminOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/students/test-drive-1/confirm',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const adminReq = http.request(adminOptions, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            console.log('Admin Access - Status Code:', res.statusCode);
            console.log('Admin Access - Response:', data);
            
            if (res.statusCode === 200) {
              console.log('✅ TEST 7b PASSED: Admin can access ADMIN-managed drive');
            } else {
              console.log('❌ TEST 7b FAILED: Admin should be able to access ADMIN-managed drive');
            }

            restoreAndExit();
          });
        });

        adminReq.on('error', (e) => {
          console.error('Admin request error:', e);
          restoreAndExit();
        });

        adminReq.write(postData);
        adminReq.end();
      });
    }

    function restoreAndExit() {
      // Restore the managedBy to COLLEGE for other tests
      prisma.driveCollege.update({
        where: {
          driveId_collegeId: {
            driveId: 'test-drive-1',
            collegeId: college1.id
          }
        },
        data: {
          managedBy: 'COLLEGE'
        }
      }).then(() => {
        console.log('Restored driveCollege managedBy to COLLEGE');
        prisma.$disconnect();
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

testManagedByAdmin();
