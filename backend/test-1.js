// Test 1: BASIC SUCCESS FLOW TEST
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNWVhNWJkNy02Yjk4LTQxOTMtODJlOC0zNzk1YWE5ODczOTgiLCJyb2xlIjoiQ09MTEVHRSIsImlhdCI6MTc3MzYyODcxOSwiZXhwIjoxNzc0MjMzNTE5fQ.K-qfgaMqZe5nRZdJm6G7qT3YD0Y4mHJkXlWQkVzY3N4";

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

console.log('Test 1: Basic Success Flow');
console.log('Token:', token);
console.log('Test Data:', JSON.stringify(testData, null, 2));
console.log('\nCurl command:');
console.log(`curl -X POST http://localhost:5000/api/students/test-drive-1/confirm \\`);
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '${JSON.stringify(testData)}'`);
