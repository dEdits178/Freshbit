# Stage 3: Authentication & Authorization - Complete Documentation

## ✅ Implementation Complete

All features have been implemented with clean modular architecture following MVC + Service Layer pattern.

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.controller.js    # Request handlers
│   │       ├── auth.service.js       # Business logic
│   │       ├── auth.routes.js        # Route definitions
│   │       └── auth.validation.js    # Input validation
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verification
│   │   ├── role.middleware.js        # Role-based access control
│   │   └── error.middleware.js       # Centralized error handling
│   ├── utils/
│   │   ├── jwt.js                    # JWT utilities
│   │   ├── response.js               # Standard response helpers
│   │   └── AppError.js               # Custom error class
│   ├── config/
│   │   └── env.js                    # Environment config
│   ├── app.js                        # Express app setup
│   └── server.js                     # Server entry point
├── config/
│   └── logger.js                     # Pino logger config
├── utils/
│   └── asyncHandler.js               # Async error wrapper
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── client.js                     # Prisma client instance
├── .env                              # Environment variables
├── .env.example                      # Environment template
└── package.json
```

---

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

**New dependencies added:**
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/verification

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/freshbit?schema=public
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
```

### 3. Run Database

**Option A: Local Docker**
```bash
docker start freshbit-postgres
```

**Option B: Cloud Database**
Update `DATABASE_URL` in `.env` with your cloud provider's connection string.

### 4. Start Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

---

## 🚀 API Endpoints

### Base URL
```
http://localhost:5000/api
```

---

### 1. Register Company

**Endpoint:** `POST /api/auth/register/company`

**Request Body:**
```json
{
  "name": "Tech Corp",
  "email": "company@techcorp.com",
  "password": "securePassword123",
  "domain": "techcorp.com"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Company registration successful. Pending admin approval.",
  "data": {
    "id": "uuid",
    "email": "company@techcorp.com",
    "role": "COMPANY",
    "status": "PENDING",
    "verified": false,
    "company": {
      "id": "uuid",
      "name": "Tech Corp",
      "domain": "techcorp.com",
      "approved": false
    }
  }
}
```

---

### 2. Register College

**Endpoint:** `POST /api/auth/register/college`

**Request Body:**
```json
{
  "name": "MIT",
  "email": "admin@mit.edu",
  "password": "securePassword123",
  "domain": "mit.edu",
  "city": "Cambridge",
  "state": "Massachusetts"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "College registration successful. Pending admin approval.",
  "data": {
    "id": "uuid",
    "email": "admin@mit.edu",
    "role": "COLLEGE",
    "status": "PENDING",
    "verified": false,
    "college": {
      "id": "uuid",
      "name": "MIT",
      "city": "Cambridge",
      "state": "Massachusetts",
      "approved": false
    }
  }
}
```

---

### 3. Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "company@techcorp.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "company@techcorp.com",
      "role": "COMPANY",
      "status": "APPROVED",
      "verified": true
    }
  }
}
```

**Error Responses:**

**Invalid Credentials (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Not Verified (403):**
```json
{
  "success": false,
  "message": "Account not verified. Please wait for admin approval."
}
```

**Not Approved (403):**
```json
{
  "success": false,
  "message": "Account not approved. Please contact admin."
}
```

---

### 4. Admin Approve User

**Endpoint:** `PATCH /api/auth/admin/approve/:userId`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User approved successfully",
  "data": {
    "id": "uuid",
    "email": "company@techcorp.com",
    "role": "COMPANY",
    "status": "APPROVED",
    "verified": true
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

---

## 📮 Postman Collection

### 1. Register Company

```
POST http://localhost:5000/api/auth/register/company
Content-Type: application/json

{
  "name": "Tech Corp",
  "email": "company@techcorp.com",
  "password": "password123",
  "domain": "techcorp.com"
}
```

### 2. Register College

```
POST http://localhost:5000/api/auth/register/college
Content-Type: application/json

{
  "name": "MIT",
  "email": "college@mit.edu",
  "password": "password123",
  "domain": "mit.edu",
  "city": "Cambridge",
  "state": "Massachusetts"
}
```

### 3. Login (After Admin Approval)

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "company@techcorp.com",
  "password": "password123"
}
```

### 4. Create Admin User (Run this SQL first)

You need to manually create an admin user in the database:

```sql
-- Run this in your PostgreSQL database
INSERT INTO "User" (id, email, password, role, status, verified)
VALUES (
  gen_random_uuid(),
  'admin@freshbit.com',
  '$2a$10$YourHashedPasswordHere',  -- Use bcrypt to hash 'admin123'
  'ADMIN',
  'APPROVED',
  true
);
```

Or use this Node.js script to generate the hash:

```javascript
const bcrypt = require('bcryptjs');
const password = 'admin123';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

### 5. Login as Admin

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@freshbit.com",
  "password": "admin123"
}
```

### 6. Approve User (Admin Only)

```
PATCH http://localhost:5000/api/auth/admin/approve/{userId}
Authorization: Bearer {admin_token}
```

---

## 🔐 Security Features

✅ **Password Hashing**
- bcrypt with 10 salt rounds
- Passwords never stored in plain text
- Passwords never returned in API responses

✅ **JWT Authentication**
- Token-based authentication
- Configurable expiration (default 7 days)
- Secure secret key from environment

✅ **Role-Based Access Control (RBAC)**
- Three roles: ADMIN, COMPANY, COLLEGE
- Middleware-based role verification
- Protected admin routes

✅ **Input Validation**
- Email format validation
- Password minimum length (6 characters)
- Required field validation
- Custom validation layer

✅ **Error Handling**
- Centralized error middleware
- Custom AppError class
- Clean error responses
- Production/development modes

✅ **Status & Verification**
- User status: PENDING, APPROVED, REJECTED, SUSPENDED
- Email verification flag
- Account approval workflow

---

## 🏗️ Architecture Patterns

### 1. **MVC + Service Layer**
- **Routes:** Define endpoints
- **Controllers:** Handle HTTP requests/responses
- **Services:** Business logic
- **Middleware:** Cross-cutting concerns

### 2. **Separation of Concerns**
- No business logic in routes
- No database calls in controllers
- Services handle all business logic
- Utilities are reusable

### 3. **Async/Await Pattern**
- All async operations use async/await
- asyncHandler wrapper for error handling
- No callback hell

### 4. **Standardized Responses**
```javascript
// Success
{
  success: true,
  message: "...",
  data: {}
}

// Error
{
  success: false,
  message: "...",
  error: {}
}
```

---

## 🧪 Testing Flow

### Complete Registration & Login Flow:

1. **Register a Company**
   ```bash
   POST /api/auth/register/company
   ```
   → Status: PENDING, Verified: false

2. **Try to Login (Will Fail)**
   ```bash
   POST /api/auth/login
   ```
   → Error: "Account not verified"

3. **Create Admin User** (Manual - see SQL above)

4. **Login as Admin**
   ```bash
   POST /api/auth/login
   ```
   → Get admin token

5. **Approve the Company User**
   ```bash
   PATCH /api/auth/admin/approve/{userId}
   Authorization: Bearer {admin_token}
   ```
   → Status: APPROVED, Verified: true

6. **Login as Company (Now Works)**
   ```bash
   POST /api/auth/login
   ```
   → Get company token

7. **Use Protected Routes**
   - Include token in Authorization header
   - Access role-specific features

---

## ⚠️ Common Errors & Solutions

### 1. "Email already exists"
- User already registered with that email
- Use different email or login

### 2. "Invalid email or password"
- Check credentials
- Email is case-sensitive

### 3. "Account not verified"
- User not approved by admin yet
- Admin needs to run approve endpoint

### 4. "No token provided"
- Missing Authorization header
- Add: `Authorization: Bearer {token}`

### 5. "You do not have permission"
- Wrong role for this endpoint
- Only ADMIN can approve users

### 6. "Invalid or expired token"
- Token expired (default 7 days)
- Login again to get new token

---

## 📊 Database Schema (Relevant Tables)

### User Table
```prisma
model User {
  id        String     @id @default(uuid())
  email     String     @unique
  password  String
  role      Role       // COMPANY | COLLEGE | ADMIN
  status    UserStatus // PENDING | APPROVED | REJECTED | SUSPENDED
  verified  Boolean    @default(false)
  company   Company?
  college   College?
}
```

### Company Table
```prisma
model Company {
  id       String  @id @default(uuid())
  name     String
  domain   String
  approved Boolean
  userId   String  @unique
  user     User    @relation(fields: [userId], references: [id])
}
```

### College Table
```prisma
model College {
  id       String  @id @default(uuid())
  name     String
  city     String
  state    String
  tier     String
  approved Boolean
  userId   String  @unique
  user     User    @relation(fields: [userId], references: [id])
}
```

---

## 🎯 Next Steps (Future Enhancements)

**Not Implemented (As Per Requirements):**
- ❌ Email sending
- ❌ Refresh tokens
- ❌ Forgot password
- ❌ OAuth
- ❌ Rate limiting

**Ready for Extension:**
- ✅ Modular structure supports easy additions
- ✅ Service layer ready for complex business logic
- ✅ Middleware system ready for more validators
- ✅ Clean separation allows parallel development

---

## 🚀 Commands Quick Reference

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production server
npm start

# Generate Prisma client
npm run prisma:generate

# Create migration
npx prisma migrate dev --name migration_name

# Seed database
npm run db:seed
```

---

## ✅ Checklist

- [x] Clean modular architecture
- [x] MVC + Service layer pattern
- [x] Separate controller/service/routes/middleware
- [x] Centralized error handling
- [x] No business logic in routes
- [x] Async/await throughout
- [x] No console logs (using Pino logger)
- [x] Environment variables
- [x] Production-safe structure
- [x] Clean JSON responses
- [x] Password hashing (bcrypt, 10 rounds)
- [x] JWT authentication
- [x] Role-based access control
- [x] Input validation
- [x] Standard response format
- [x] Prisma transactions where needed
- [x] No sensitive data in responses

---

## 📝 Notes

1. **First Time Setup:** Create an admin user manually using the SQL script provided
2. **Token Storage:** Frontend should store JWT in localStorage/sessionStorage
3. **Authorization Header Format:** `Bearer {token}`
4. **Password Requirements:** Minimum 6 characters (can be enhanced)
5. **Token Expiration:** Default 7 days (configurable in .env)

---

**Stage 3 Authentication & Authorization Module: ✅ COMPLETE**
