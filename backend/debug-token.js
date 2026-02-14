// Debug script to check what's in the JWT token
const jwt = require('jsonwebtoken');

const token = process.argv[2];

if (!token) {
    console.log('Usage: node debug-token.js <YOUR_JWT_TOKEN>');
    console.log('\nExample:');
    console.log('1. Login at http://localhost:5173/login');
    console.log('2. Open DevTools (F12) → Application → Local Storage');
    console.log('3. Copy the "token" value');
    console.log('4. Run: node debug-token.js <paste_token_here>');
    process.exit(1);
}

try {
    // Decode without verification to see what's inside
    const decoded = jwt.decode(token);

    console.log('\n📦 JWT Token Contents:\n');
    console.log(JSON.stringify(decoded, null, 2));

    console.log('\n🔍 Key Fields:');
    console.log('   userId:', decoded.userId);
    console.log('   role:', decoded.role);
    console.log('   exp:', decoded.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'N/A');
    console.log('   iat:', decoded.iat ? new Date(decoded.iat * 1000).toLocaleString() : 'N/A');

    if (decoded.role) {
        console.log('\n✅ Token has role field:', decoded.role);
    } else {
        console.log('\n❌ Token is missing role field!');
    }

} catch (error) {
    console.error('\n❌ Error decoding token:', error.message);
}
