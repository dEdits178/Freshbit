const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testApplicationEngine() {
  try {
    console.log('=== TESTING APPLICATION ENGINE ===');

    // Get test users
    const [company, college, admin] = await Promise.all([
      prisma.user.findUnique({ where: { id: '969fdef2-6955-4d8f-a13c-48e206ec8898' } }), // Company user ID
      prisma.user.findUnique({ where: { id: '35ea5bd7-6b98-4193-82e8-3795aa987398' } }), // College1 user ID
      prisma.user.findUnique({ where: { email: 'admin@freshbit.test' } })
    ]);

    if (!company || !college || !admin) {
      console.error('Test users not found');
      return;
    }

    // Generate tokens
    const companyToken = jwt.sign(
      { userId: company.id, role: company.role },
      'your-super-secret-jwt-key-change-this-in-production-minimum-32-chars',
      { expiresIn: '7d' }
    );

    const collegeToken = jwt.sign(
      { userId: college.id, role: college.role },
      'your-super-secret-jwt-key-change-this-in-production-minimum-32-chars',
      { expiresIn: '7d' }
    );

    const adminToken = jwt.sign(
      { userId: admin.id, role: admin.role },
      'your-super-secret-jwt-key-change-this-in-production-minimum-32-chars',
      { expiresIn: '7d' }
    );

    // Get test drive and college
    const drive = await prisma.drive.findFirst({ where: { status: 'PUBLISHED' } });
    const testCollege = await prisma.college.findFirst({ where: { id: '3cf0a2c6-9bf3-4acf-9201-9e3b74230873' } }); // Alpha College ID

    if (!drive || !testCollege) {
      console.error('Test drive or college not found');
      return;
    }

    console.log(`\nUsing Drive: ${drive.id}`);
    console.log(`Using College: ${testCollege.id}`);

    // Get students for testing
    const students = await prisma.student.findMany({
      where: { collegeId: testCollege.id },
      take: 3
    });

    if (students.length === 0) {
      console.error('No students found for testing');
      return;
    }

    const studentIds = students.map(s => s.id);
    console.log(`\nTesting with ${studentIds.length} students`);

    // Test 1: Create Applications (College)
    console.log('\n--- Test 1: Create Applications (College) ---');
    await testRequest('Create Apps - College', 'POST', `/applications/${drive.id}/create`, {
      studentIds
    }, collegeToken);

    // Test 2: Create Applications (Admin)
    console.log('\n--- Test 2: Create Applications (Admin) ---');
    await testRequest('Create Apps - Admin', 'POST', `/applications/${drive.id}/create`, {
      studentIds: students.slice(0, 1).map(s => s.id),
      collegeId: testCollege.id
    }, adminToken);

    // Test 3: Get Applications by Drive (Company)
    console.log('\n--- Test 3: Get Applications by Drive (Company) ---');
    await testRequest('Get Apps by Drive - Company', 'GET', `/applications/drive/${drive.id}?page=1&limit=10`, null, companyToken);

    // Test 4: Get Applications by College (College)
    console.log('\n--- Test 4: Get Applications by College (College) ---');
    await testRequest('Get Apps by College - College', 'GET', `/applications/college/${drive.id}/${testCollege.id}?page=1&limit=10`, null, collegeToken);

    // Test 5: Get Application Stats (Company)
    console.log('\n--- Test 5: Get Application Stats (Company) ---');
    await testRequest('Get Stats - Company', 'GET', `/applications/stats/${drive.id}`, null, companyToken);

    // Test 6: Update Application Status (Company)
    console.log('\n--- Test 6: Update Application Status (Company) ---');
    
    // Get an application to update
    const application = await prisma.application.findFirst({
      where: { driveId: drive.id }
    });

    if (application) {
      await testRequest('Update Status - Company', 'PATCH', `/applications/${application.id}/status`, {
        status: 'IN_TEST'
      }, companyToken);
    } else {
      console.log('No application found to update status');
    }

    console.log('\n=== APPLICATION ENGINE TESTS COMPLETED ===');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function testRequest(testName, method, path, data, token) {
  const postData = data ? JSON.stringify(data) : null;

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api${path}`,
    method: method,
    headers: {
      'Authorization': token ? `Bearer ${token}` : undefined,
      'Content-Type': 'application/json',
      ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`${testName} - Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`${testName} - ✅ SUCCESS`);
            if (parsed.data) {
              console.log(`Response: ${JSON.stringify(parsed.data, null, 2).substring(0, 200)}...`);
            }
          } else {
            console.log(`${testName} - ❌ FAILED: ${parsed.message || 'Unknown error'}`);
          }
        } catch (e) {
          console.log(`${testName} - ❌ FAILED: Invalid response`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`${testName} - Request error:`, e.message);
      resolve();
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

testApplicationEngine();
