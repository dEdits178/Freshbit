# Stage 3 Auth - Test Scenarios

## 🧪 Complete Testing Guide

### Prerequisites
1. Database running (Docker or cloud)
2. Server running: `npm run dev`
3. Admin user created: `npm run create:admin`
4. Postman installed (or use curl)

---

## Test Scenario 1: Admin Login ✅

**Goal:** Verify admin can login

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@freshbit.com",
  "password": "admin123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUz...",
    "user": {
      "id": "...",
      "email": "admin@freshbit.com",
      "role": "ADMIN",
      "status": "APPROVED",
      "verified": true
    }
  }
}
```

**Save the token!**

---

## Test Scenario 2: Register Company ✅

**Goal:** Company can register but needs approval

**Request:**
```http
POST http://localhost:5000/api/auth/register/company
Content-Type: application/json

{
  "name": "Google",
  "email": "hr@google.com",
  "password": "google123",
  "domain": "google.com"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Company registration successful. Pending admin approval.",
  "data": {
    "id": "company-user-id-here",
    "email": "hr@google.com",
    "role": "COMPANY",
    "status": "PENDING",
    "verified": false,
    "company": {
      "id": "...",
      "name": "Google",
      "domain": "google.com",
      "approved": false
    }
  }
}
```

**Save the user ID!**

---

## Test Scenario 3: Company Login Before Approval ❌

**Goal:** Verify unapproved users cannot login

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "hr@google.com",
  "password": "google123"
}
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Account not verified. Please wait for admin approval."
}
```

---

## Test Scenario 4: Admin Approves Company ✅

**Goal:** Admin approves pending company

**Request:**
```http
PATCH http://localhost:5000/api/auth/admin/approve/{company-user-id}
Authorization: Bearer {admin-token}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "User approved successfully",
  "data": {
    "id": "...",
    "email": "hr@google.com",
    "role": "COMPANY",
    "status": "APPROVED",
    "verified": true
  }
}
```

---

## Test Scenario 5: Company Login After Approval ✅

**Goal:** Approved company can now login

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "hr@google.com",
  "password": "google123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "...",
      "email": "hr@google.com",
      "role": "COMPANY",
      "status": "APPROVED",
      "verified": true
    }
  }
}
```

---

## Test Scenario 6: Register College ✅

**Goal:** College can register

**Request:**
```http
POST http://localhost:5000/api/auth/register/college
Content-Type: application/json

{
  "name": "Stanford University",
  "email": "admin@stanford.edu",
  "password": "stanford123",
  "domain": "stanford.edu",
  "city": "Stanford",
  "state": "California"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "College registration successful. Pending admin approval.",
  "data": {
    "id": "college-user-id",
    "email": "admin@stanford.edu",
    "role": "COLLEGE",
    "status": "PENDING",
    "verified": false,
    "college": {
      "id": "...",
      "name": "Stanford University",
      "city": "Stanford",
      "state": "California",
      "approved": false
    }
  }
}
```

---

## Test Scenario 7: Non-Admin Tries to Approve ❌

**Goal:** Verify only admin can approve users

**Request:**
```http
PATCH http://localhost:5000/api/auth/admin/approve/{college-user-id}
Authorization: Bearer {company-token}
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

---

## Test Scenario 8: Missing Token ❌

**Goal:** Verify protected routes need token

**Request:**
```http
PATCH http://localhost:5000/api/auth/admin/approve/{user-id}
# NO Authorization header
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

---

## Test Scenario 9: Invalid Token ❌

**Goal:** Verify invalid tokens are rejected

**Request:**
```http
PATCH http://localhost:5000/api/auth/admin/approve/{user-id}
Authorization: Bearer invalid-token-here
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

## Test Scenario 10: Duplicate Email Registration ❌

**Goal:** Verify email uniqueness

**Request:**
```http
POST http://localhost:5000/api/auth/register/company
Content-Type: application/json

{
  "name": "Another Google",
  "email": "hr@google.com",
  "password": "different123",
  "domain": "anothergoogle.com"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

## Test Scenario 11: Invalid Email Format ❌

**Goal:** Verify email validation

**Request:**
```http
POST http://localhost:5000/api/auth/register/company
Content-Type: application/json

{
  "name": "Test Company",
  "email": "invalid-email",
  "password": "password123",
  "domain": "test.com"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

---

## Test Scenario 12: Missing Required Fields ❌

**Goal:** Verify required field validation

**Request:**
```http
POST http://localhost:5000/api/auth/register/company
Content-Type: application/json

{
  "name": "Test Company",
  "email": "test@test.com"
  # Missing: password, domain
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "All fields are required: name, email, password, domain"
}
```

---

## Test Scenario 13: Short Password ❌

**Goal:** Verify password length validation

**Request:**
```http
POST http://localhost:5000/api/auth/register/company
Content-Type: application/json

{
  "name": "Test Company",
  "email": "test@test.com",
  "password": "123",
  "domain": "test.com"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Password must be at least 6 characters"
}
```

---

## Test Scenario 14: Wrong Password ❌

**Goal:** Verify password verification

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "hr@google.com",
  "password": "wrong-password"
}
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Test Scenario 15: Non-existent User ❌

**Goal:** Verify user existence check

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "doesnotexist@example.com",
  "password": "password123"
}
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Test Scenario 16: Health Check ✅

**Goal:** Verify server is running

**Request:**
```http
GET http://localhost:5000/
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "FreshBit API Running",
  "version": "1.0.0"
}
```

---

## 📊 Test Summary

| # | Scenario | Expected | Category |
|---|----------|----------|----------|
| 1 | Admin Login | ✅ Success | Authentication |
| 2 | Register Company | ✅ Success | Registration |
| 3 | Login Before Approval | ❌ Forbidden | Authorization |
| 4 | Admin Approve | ✅ Success | Authorization |
| 5 | Login After Approval | ✅ Success | Authentication |
| 6 | Register College | ✅ Success | Registration |
| 7 | Non-Admin Approve | ❌ Forbidden | Authorization |
| 8 | Missing Token | ❌ Unauthorized | Security |
| 9 | Invalid Token | ❌ Unauthorized | Security |
| 10 | Duplicate Email | ❌ Bad Request | Validation |
| 11 | Invalid Email | ❌ Bad Request | Validation |
| 12 | Missing Fields | ❌ Bad Request | Validation |
| 13 | Short Password | ❌ Bad Request | Validation |
| 14 | Wrong Password | ❌ Unauthorized | Authentication |
| 15 | Non-existent User | ❌ Unauthorized | Authentication |
| 16 | Health Check | ✅ Success | Infrastructure |

---

## 🎯 Quick Test Script (Bash/PowerShell)

Save this as `test-api.sh` or `test-api.ps1`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "=== Test 1: Health Check ==="
curl http://localhost:5000/

echo -e "\n\n=== Test 2: Admin Login ==="
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@freshbit.com","password":"admin123"}' \
  | jq -r '.data.token')

echo "Token: $ADMIN_TOKEN"

echo -e "\n\n=== Test 3: Register Company ==="
curl -X POST $BASE_URL/auth/register/company \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Corp","email":"test@test.com","password":"test123","domain":"test.com"}'

echo -e "\n\n=== Test 4: Invalid Email ==="
curl -X POST $BASE_URL/auth/register/company \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"invalid","password":"test123","domain":"test.com"}'

echo -e "\n\nTests complete!"
```

---

## ✅ Validation Checklist

Run through these manually or automated:

- [ ] Admin can login
- [ ] Company can register
- [ ] College can register
- [ ] Unapproved users cannot login
- [ ] Admin can approve users
- [ ] Approved users can login
- [ ] Non-admin cannot approve
- [ ] Protected routes need token
- [ ] Invalid tokens are rejected
- [ ] Duplicate emails are rejected
- [ ] Email format is validated
- [ ] Required fields are validated
- [ ] Password length is validated
- [ ] Wrong passwords are rejected
- [ ] Non-existent users are rejected
- [ ] Health check works

---

## 🔍 Database Verification

Check database directly:

```sql
-- View all users
SELECT id, email, role, status, verified FROM "User";

-- View pending approvals
SELECT id, email, role FROM "User" WHERE status = 'PENDING';

-- View companies
SELECT u.email, c.name, c.approved 
FROM "User" u 
JOIN "Company" c ON u.id = c."userId";

-- View colleges
SELECT u.email, c.name, c.city, c.approved 
FROM "User" u 
JOIN "College" c ON u.id = c."userId";
```

Or use Prisma Studio:
```bash
npx prisma studio
```

---

**Happy Testing! 🧪**
