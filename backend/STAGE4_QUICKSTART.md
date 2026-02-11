# Stage 4 - Quick Start Guide

## 🚀 Setup & Testing (10 Minutes)

### Prerequisites
- ✅ Stage 3 completed (Auth working)
- ✅ Database running
- ✅ Server running (`npm run dev`)
- ✅ Admin user created
- ✅ At least one company approved
- ✅ At least one college approved

---

## 📋 Quick Test Flow

### Step 1: Ensure Test Users Exist

From Stage 3, you should have:
- **Company:** hr@google.com (APPROVED)
- **College:** admin@mit.edu (APPROVED if you ran approval)

If college is not approved:
```bash
# Login as admin, get token, then approve
PATCH /api/auth/admin/approve/{collegeUserId}
```

---

### Step 2: Get College ID

We need the college UUID to create a drive.

**Option A: Via Database**
```sql
SELECT id, name FROM "College";
```

**Option B: Via College Login**
```bash
POST /api/auth/login
{
  "email": "admin@mit.edu",
  "password": "mit123"
}

# Then
GET /api/college/profile
# Copy the "id" field
```

**Save this College ID!** We'll call it `{collegeId}`

---

### Step 3: Login as Company

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "hr@google.com",
  "password": "google123"
}
```

**Save the token:** `{companyToken}`

---

### Step 4: Create a Drive

```bash
POST http://localhost:5000/api/company/drives
Authorization: Bearer {companyToken}
Content-Type: application/json

{
  "roleTitle": "Senior Software Engineer",
  "salary": 2000000,
  "description": "We are hiring senior engineers with 5+ years experience",
  "collegeIds": ["{collegeId}"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drive created successfully",
  "data": {
    "id": "{driveId}",
    "status": "DRAFT",
    "driveColleges": [...],
    "stages": [
      // 5 stages per college, all NOT_STARTED
    ]
  }
}
```

**Save the Drive ID:** `{driveId}`

---

### Step 5: View Company Drives

```bash
GET http://localhost:5000/api/company/drives
Authorization: Bearer {companyToken}
```

You should see the drive you just created with status DRAFT.

---

### Step 6: Publish the Drive

```bash
PATCH http://localhost:5000/api/company/drives/{driveId}/publish
Authorization: Bearer {companyToken}
```

**Expected Response:**
- Drive status = PUBLISHED
- APPLICATIONS stage = ACTIVE for all colleges
- Other stages = NOT_STARTED

---

### Step 7: Login as College

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@mit.edu",
  "password": "mit123"
}
```

**Save the token:** `{collegeToken}`

---

### Step 8: View College Profile

```bash
GET http://localhost:5000/api/college/profile
Authorization: Bearer {collegeToken}
```

You'll see college details.

---

### Step 9: Update College Profile

```bash
PATCH http://localhost:5000/api/college/profile
Authorization: Bearer {collegeToken}
Content-Type: application/json

{
  "tier": "Tier 1",
  "name": "Massachusetts Institute of Technology"
}
```

Profile should be updated.

---

### Step 10: View Assigned Drives

```bash
GET http://localhost:5000/api/college/drives
Authorization: Bearer {collegeToken}
```

**Expected Response:**
- You should see the published drive
- Current stage = APPLICATIONS
- Company info included

---

### Step 11: View Drive Details

```bash
GET http://localhost:5000/api/college/drives/{driveId}
Authorization: Bearer {collegeToken}
```

**Expected Response:**
- Full drive details
- All 5 stages with statuses
- Company information
- Current active stage highlighted

---

## ✅ Success Checklist

After completing the flow:

- [ ] Company can create drives (status DRAFT)
- [ ] Drive has colleges assigned
- [ ] Drive has 5 stages per college initialized
- [ ] Company can publish drive
- [ ] After publish, drive status = PUBLISHED
- [ ] After publish, APPLICATIONS stage = ACTIVE
- [ ] College can view profile
- [ ] College can update profile (except approved/userId)
- [ ] College can view assigned drives
- [ ] College sees current active stage
- [ ] College can view drive details
- [ ] Permissions enforced (company can't see college endpoints)

---

## 🧪 Test Scenarios

### Test 1: Create Drive with Multiple Colleges

```json
{
  "roleTitle": "Data Scientist",
  "salary": 1800000,
  "description": "Looking for data scientists...",
  "collegeIds": ["{collegeId1}", "{collegeId2}"]
}
```

**Result:** 10 total stages created (5 per college)

---

### Test 2: College Cannot See Unassigned Drives

1. Create a drive assigned to CollegeA
2. Login as CollegeB
3. Try to view drives
4. **Result:** CollegeB should not see the drive

---

### Test 3: Company Cannot Publish Same Drive Twice

1. Publish a drive
2. Try to publish again
3. **Result:** Error "Drive is already published"

---

### Test 4: Validation Errors

**Missing fields:**
```json
{
  "roleTitle": "Engineer"
  // Missing salary, description, collegeIds
}
```
**Result:** 400 error

**Empty collegeIds:**
```json
{
  "roleTitle": "Engineer",
  "salary": 1000000,
  "description": "Test",
  "collegeIds": []
}
```
**Result:** 400 error "collegeIds must be a non-empty array"

**Invalid salary:**
```json
{
  "roleTitle": "Engineer",
  "salary": "not-a-number",
  "description": "Test",
  "collegeIds": ["{collegeId}"]
}
```
**Result:** 400 error "salary must be a positive number"

---

### Test 5: Permission Checks

**Company tries to access college endpoint:**
```bash
GET /api/college/profile
Authorization: Bearer {companyToken}
```
**Result:** 403 Forbidden

**College tries to create drive:**
```bash
POST /api/company/drives
Authorization: Bearer {collegeToken}
{...}
```
**Result:** 403 Forbidden

---

## 🎯 API Endpoint Summary

### Company Endpoints
```
POST   /api/company/drives              # Create drive
GET    /api/company/drives              # Get all drives
GET    /api/company/drives/:id          # Get specific drive
PATCH  /api/company/drives/:id/publish  # Publish drive
```

### College Endpoints
```
GET    /api/college/profile             # Get profile
PATCH  /api/college/profile             # Update profile
GET    /api/college/drives              # Get assigned drives
GET    /api/college/drives/:id          # Get drive details
```

---

## 🔍 Database Verification

Check the database after creating and publishing a drive:

```sql
-- View drives
SELECT id, "roleTitle", salary, status, "companyId" FROM "Drive";

-- View drive-college mappings
SELECT dc.id, d."roleTitle", c.name as college_name
FROM "DriveCollege" dc
JOIN "Drive" d ON dc."driveId" = d.id
JOIN "College" c ON dc."collegeId" = c.id;

-- View stages
SELECT ds.id, d."roleTitle", c.name as college, ds.stage, ds.status
FROM "DriveStage" ds
JOIN "Drive" d ON ds."driveId" = d.id
JOIN "College" c ON ds."collegeId" = c.id
ORDER BY d."roleTitle", c.name, ds.stage;
```

Or use Prisma Studio:
```bash
npx prisma studio
```

---

## 💡 Tips

1. **College IDs:** Keep a list of college IDs handy for testing
2. **Postman:** Import `STAGE4_POSTMAN.json` for easier testing
3. **Logs:** Check server console for any errors
4. **Tokens:** Store tokens in Postman variables
5. **Database:** Use Prisma Studio to visualize data

---

## ⚠️ Common Issues

### Issue: "College profile not found"
**Solution:** Make sure college is approved (status=APPROVED, verified=true)

### Issue: "One or more colleges not found"
**Solution:** Verify college UUIDs are correct

### Issue: "You do not have permission"
**Solution:** Check you're using the right role token

### Issue: "Drive not found"
**Solution:** Verify drive UUID and that it belongs to your company

---

## 🎉 What's Next

After Stage 4, you have:
- ✅ Drive creation and publishing
- ✅ College assignment
- ✅ Stage initialization
- ✅ College profile management
- ✅ Drive visibility for colleges

Ready for:
- Stage 5: Student uploads and applications
- Stage 6: Stage transitions and shortlisting
- Stage 7: File uploads and processing

---

**Stage 4 Complete - Drive Engine Working! 🚀**
