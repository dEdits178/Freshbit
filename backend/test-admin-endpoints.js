// Quick test script to verify admin endpoints
// Run with: node test-admin-endpoints.js

const API_URL = 'http://localhost:5000';

async function testAdminEndpoints() {
    console.log('🧪 Testing Admin Endpoints\n');

    // Step 1: Login as admin
    console.log('1️⃣  Logging in as admin...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@freshbit.com',
            password: 'Admin@123'
        })
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
        console.error('❌ Login failed:', loginData.message);
        return;
    }

    console.log('✅ Login successful');
    console.log('   User:', loginData.data.user.email);
    console.log('   Role:', loginData.data.user.role);

    const token = loginData.data.accessToken;

    // Step 2: Test /api/admin/stats
    console.log('\n2️⃣  Testing GET /api/admin/stats...');
    const statsResponse = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const statsData = await statsResponse.json();

    if (!statsData.success) {
        console.error('❌ Stats failed:', statsData.message);
        console.error('   Status:', statsResponse.status);
        return;
    }

    console.log('✅ Stats endpoint working');
    console.log('   Total Drives:', statsData.data.totalDrives);
    console.log('   Active Drives:', statsData.data.activeDrives);
    console.log('   Total Colleges:', statsData.data.totalColleges);

    // Step 3: Test /api/admin/drives
    console.log('\n3️⃣  Testing GET /api/admin/drives...');
    const drivesResponse = await fetch(`${API_URL}/api/admin/drives?page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const drivesData = await drivesResponse.json();

    if (!drivesData.success) {
        console.error('❌ Drives failed:', drivesData.message);
        return;
    }

    console.log('✅ Drives endpoint working');
    console.log('   Total:', drivesData.data.total);
    console.log('   Drives:', drivesData.data.drives.length);

    // Step 4: Test /api/admin/colleges
    console.log('\n4️⃣  Testing GET /api/admin/colleges...');
    const collegesResponse = await fetch(`${API_URL}/api/admin/colleges?page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const collegesData = await collegesResponse.json();

    if (!collegesData.success) {
        console.error('❌ Colleges failed:', collegesData.message);
        return;
    }

    console.log('✅ Colleges endpoint working');
    console.log('   Total:', collegesData.data.total);
    console.log('   Colleges:', collegesData.data.colleges.length);

    // Step 5: Test /api/admin/analytics/overview
    console.log('\n5️⃣  Testing GET /api/admin/analytics/overview...');
    const analyticsResponse = await fetch(`${API_URL}/api/admin/analytics/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const analyticsData = await analyticsResponse.json();

    if (!analyticsData.success) {
        console.error('❌ Analytics failed:', analyticsData.message);
        return;
    }

    console.log('✅ Analytics endpoint working');
    console.log('   Applications Over Time:', analyticsData.data.applicationsOverTime.length, 'months');
    console.log('   Top Colleges:', analyticsData.data.topColleges.length);

    console.log('\n🎉 All admin endpoints are working!\n');
    console.log('📋 Summary:');
    console.log('   ✅ Login');
    console.log('   ✅ Dashboard Stats');
    console.log('   ✅ Drives List');
    console.log('   ✅ Colleges List');
    console.log('   ✅ Analytics');
    console.log('\n💡 Your frontend should work now!');
    console.log('   Just refresh the browser and login again.');
}

testAdminEndpoints().catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
});
