# Stage 4: Drive & College Management - Complete Documentation

## ✅ Implementation Complete

All Drive and College management features have been implemented with clean modular architecture.

---

## 📁 New Files Created

```
src/
  modules/
    drive/
      ├── drive.controller.js     ✅ Drive request handlers
      ├── drive.service.js        ✅ Drive business logic
      ├── drive.routes.js         ✅ Drive route definitions
      └── drive.validation.js     ✅ Drive input validation
    college/
      ├── college.controller.js   ✅ College request handlers
      ├── college.service.js      ✅ College business logic
      ├── college.routes.js       ✅ College route definitions
      └── college.validation.js   ✅ College input validation
  app.js                          ✅ Updated with new routes
```

---

## 🚀 API Endpoints

### Base URL
```
http://localhost:5000/api
```

---

## 📋 COMPANY ENDPOINTS

### 1. Create Drive

**Endpoint:** `POST /api/company/drives`

**Authentication:** Required (JWT)

**Role:** COMPANY only

**Request Body:**
```json
{
  "roleTitle": "Software Engineer",
  "salary": 1200000,
  "description": "Looking for talented software engineers with 2+ years experience",
  "collegeIds": [
    "college-uuid-1",
    "college-uuid-2"
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Drive created successfully",
  "data": {
    "id": "drive-uuid",
    "companyId": "company-uuid",
    "roleTitle": "Software Engineer",
    "salary": 1200000,
    "description": "Looking for talented software engineers...",
    "status": "DRAFT",
    "jdFileUrl": null,
    "createdAt": "2026-02-11T18:00:00.000Z",
    "updatedAt": "2026-02-11T18:00:00.000Z",
    "company": {
      "id": "company-uuid",
      "name": "Google",
      "domain": "google.com"
    },
    "driveColleges": [
      {
        "id": "drive-college-uuid-1",
        "driveId": "drive-uuid",
        "collegeId": "college-uuid-1",
        "college": {
          "id": "college-uuid-1",
          "name": "MIT",
          "city": "Cambridge",
          "state": "Massachusetts"
        }
      }
    ],
    "stages": [
      {
        "id": "stage-uuid-1",
        "stage": "APPLICATIONS",
        "status": "NOT_STARTED",
        "collegeId": "college-uuid-1"
      },
      {
        "id": "stage-uuid-2",
        "stage": "TEST",
        "status": "NOT_STARTED",
        "collegeId": "college-uuid-1"
      }
      // ... more stages (5 stages per college)
    ]
  }
}
```

**What Happens:**
1. ✅ Drive created with status = DRAFT
2. ✅ DriveCollege records created for each college
3. ✅ 5 stages initialized per college (APPLICATIONS, TEST, SHORTLIST, INTERVIEW, FINAL)
4. ✅ All stages status = NOT_STARTED
5. ✅ Transaction ensures atomicity

---

### 2. Publish Drive

**Endpoint:** `PATCH /api/company/drives/:driveId/publish`

**Authentication:** Required (JWT)

**Role:** COMPANY only

**URL Parameters:**
- `driveId` - UUID of the drive to publish

**Success Response (200):**
```json
{
  "success": true,
  "message": "Drive published successfully",
  "data": {
    "id": "drive-uuid",
    "status": "PUBLISHED",
    "stages": [
      {
        "id": "stage-uuid",
        "stage": "APPLICATIONS",
        "status": "ACTIVE",
        "collegeId": "college-uuid"
      },
      {
        "id": "stage-uuid-2",
        "stage": "TEST",
        "status": "NOT_STARTED",
        "collegeId": "college-uuid"
      }
      // ... other stages
    ]
  }
}
```

**What Happens:**
1. ✅ Drive status updated to PUBLISHED
2. ✅ APPLICATIONS stage set to ACTIVE for all colleges
3. ✅ Transaction ensures consistency

---

### 3. Get All Company Drives

**Endpoint:** `GET /api/company/drives`

**Authentication:** Required (JWT)

**Role:** COMPANY only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Drives retrieved successfully",
  "data": [
    {
      "id": "drive-uuid-1",
      "roleTitle": "Software Engineer",
      "salary": 1200000,
      "description": "...",
      "status": "PUBLISHED",
      "driveColleges": [
        {
          "college": {
            "id": "college-uuid",
            "name": "MIT",
            "city": "Cambridge",
            "state": "Massachusetts"
          }
        }
      ],
      "stages": [
        {
          "stage": "APPLICATIONS",
          "status": "ACTIVE",
          "collegeId": "college-uuid"
        }
      ],
      "createdAt": "2026-02-11T18:00:00.000Z"
    }
  ]
}
```

---

### 4. Get Specific Drive

**Endpoint:** `GET /api/company/drives/:driveId`

**Authentication:** Required (JWT)

**Role:** COMPANY only

**URL Parameters:**
- `driveId` - UUID of the drive

**Success Response (200):**
```json
{
  "success": true,
  "message": "Drive retrieved successfully",
  "data": {
    "id": "drive-uuid",
    "roleTitle": "Software Engineer",
    "salary": 1200000,
    "description": "...",
    "status": "PUBLISHED",
    "company": {
      "id": "company-uuid",
      "name": "Google",
      "domain": "google.com"
    },
    "driveColleges": [...],
    "stages": [...]
  }
}
```

---

## 🎓 COLLEGE ENDPOINTS

### 5. Get College Profile

**Endpoint:** `GET /api/college/profile`

**Authentication:** Required (JWT)

**Role:** COLLEGE only

**Success Response (200):**
```json
{
  "success": true,
  "message": "College profile retrieved successfully",
  "data": {
    "id": "college-uuid",
    "name": "MIT",
    "city": "Cambridge",
    "state": "Massachusetts",
    "tier": "Tier 1",
    "approved": true,
    "userId": "user-uuid",
    "createdAt": "2026-02-11T18:00:00.000Z",
    "updatedAt": "2026-02-11T18:00:00.000Z",
    "user": {
      "id": "user-uuid",
      "email": "admin@mit.edu",
      "role": "COLLEGE",
      "status": "APPROVED",
      "verified": true
    }
  }
}
```

---

### 6. Update College Profile

**Endpoint:** `PATCH /api/college/profile`

**Authentication:** Required (JWT)

**Role:** COLLEGE only

**Request Body:**
```json
{
  "name": "Massachusetts Institute of Technology",
  "city": "Cambridge",
  "state": "Massachusetts",
  "tier": "Tier 1"
}
```

**Notes:**
- All fields are optional
- At least one field must be provided
- Cannot update `approved` or `userId` fields

**Success Response (200):**
```json
{
  "success": true,
  "message": "College profile updated successfully",
  "data": {
    "id": "college-uuid",
    "name": "Massachusetts Institute of Technology",
    "city": "Cambridge",
    "state": "Massachusetts",
    "tier": "Tier 1",
    "approved": true,
    "userId": "user-uuid",
    "user": {...}
  }
}
```

---

### 7. Get Assigned Drives

**Endpoint:** `GET /api/college/drives`

**Authentication:** Required (JWT)

**Role:** COLLEGE only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Drives retrieved successfully",
  "data": [
    {
      "id": "drive-uuid",
      "roleTitle": "Software Engineer",
      "salary": 1200000,
      "description": "...",
      "status": "PUBLISHED",
      "company": {
        "id": "company-uuid",
        "name": "Google",
        "domain": "google.com"
      },
      "currentStage": "APPLICATIONS",
      "stages": [
        {
          "id": "stage-uuid",
          "stage": "APPLICATIONS",
          "status": "ACTIVE"
        },
        {
          "id": "stage-uuid-2",
          "stage": "TEST",
          "status": "NOT_STARTED"
        }
      ],
      "createdAt": "2026-02-11T18:00:00.000Z"
    }
  ]
}
```

---

### 8. Get Drive Details

**Endpoint:** `GET /api/college/drives/:driveId`

**Authentication:** Required (JWT)

**Role:** COLLEGE only

**URL Parameters:**
- `driveId` - UUID of the drive

**Success Response (200):**
```json
{
  "success": true,
  "message": "Drive details retrieved successfully",
  "data": {
    "id": "drive-uuid",
    "roleTitle": "Software Engineer",
    "salary": 1200000,
    "description": "...",
    "status": "PUBLISHED",
    "jdFileUrl": null,
    "company": {
      "id": "company-uuid",
      "name": "Google",
      "domain": "google.com"
    },
    "currentStage": "APPLICATIONS",
    "stages": [
      {
        "id": "stage-uuid",
        "stage": "APPLICATIONS",
        "status": "ACTIVE",
        "updatedAt": "2026-02-11T18:00:00.000Z"
      }
    ],
    "createdAt": "2026-02-11T18:00:00.000Z",
    "updatedAt": "2026-02-11T18:00:00.000Z"
  }
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "All fields are required: roleTitle, salary, description, collegeIds"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Drive not found"
}
```

---

## 🔐 Permission Rules

### COMPANY Role Can:
- ✅ Create drives
- ✅ Publish own drives
- ✅ View own drives
- ✅ Assign drives to colleges
- ❌ Cannot view other companies' drives
- ❌ Cannot modify published drives (in this stage)

### COLLEGE Role Can:
- ✅ View assigned drives
- ✅ View drive details (if assigned)
- ✅ Update own profile
- ✅ View own profile
- ❌ Cannot view drives not assigned to them
- ❌ Cannot create or modify drives

---

## 🎯 Business Logic

### Drive Creation Flow
1. Validate company exists
2. Validate all colleges exist
3. Create Drive (status = DRAFT)
4. Create DriveCollege link records
5. Initialize 5 stages per college:
   - APPLICATIONS (NOT_STARTED)
   - TEST (NOT_STARTED)
   - SHORTLIST (NOT_STARTED)
   - INTERVIEW (NOT_STARTED)
   - FINAL (NOT_STARTED)
6. Return complete drive object

### Drive Publish Flow
1. Verify drive belongs to company
2. Check drive is not already published
3. Update drive status to PUBLISHED
4. Set APPLICATIONS stage to ACTIVE for all colleges
5. Return updated drive

### College View Drives Flow
1. Find college profile
2. Get all DriveCollege records
3. Load drives with company info
4. Load stages for this college only
5. Identify current active stage
6. Return formatted drives

---

## 🧪 Validation Rules

### Create Drive
- ✅ `roleTitle` - Required, non-empty string
- ✅ `salary` - Required, positive number
- ✅ `description` - Required, non-empty string
- ✅ `collegeIds` - Required, non-empty array of UUIDs

### Update College Profile
- ✅ At least one field required
- ✅ Cannot update `approved` field
- ✅ Cannot update `userId` field
- ✅ String fields cannot be empty if provided

---

## 📊 Database Operations

### Transactions Used
- ✅ Create Drive (Drive + DriveCollege + DriveStage)
- ✅ Publish Drive (Drive update + Stage updates)

### Relations Handled
- ✅ Drive ↔ Company (many-to-one)
- ✅ Drive ↔ College (many-to-many via DriveCollege)
- ✅ Drive ↔ DriveStage (one-to-many)
- ✅ DriveStage ↔ College (many-to-one)

---

## 🔍 Example Usage Scenarios

### Scenario 1: Company Creates and Publishes Drive

```javascript
// Step 1: Login as company
POST /api/auth/login
{
  "email": "hr@google.com",
  "password": "google123"
}
// Save token

// Step 2: Create drive
POST /api/company/drives
Authorization: Bearer {token}
{
  "roleTitle": "Senior Software Engineer",
  "salary": 2000000,
  "description": "We are hiring senior engineers...",
  "collegeIds": ["mit-uuid", "stanford-uuid"]
}
// Save driveId

// Step 3: Publish drive
PATCH /api/company/drives/{driveId}/publish
Authorization: Bearer {token}

// Step 4: View all drives
GET /api/company/drives
Authorization: Bearer {token}
```

### Scenario 2: College Views Assigned Drives

```javascript
// Step 1: Login as college
POST /api/auth/login
{
  "email": "admin@mit.edu",
  "password": "mit123"
}
// Save token

// Step 2: View assigned drives
GET /api/college/drives
Authorization: Bearer {token}

// Step 3: View specific drive details
GET /api/college/drives/{driveId}
Authorization: Bearer {token}

// Step 4: Update profile
PATCH /api/college/profile
Authorization: Bearer {token}
{
  "tier": "Tier 1",
  "name": "Massachusetts Institute of Technology"
}
```

---

## 📝 Stage Summary

### 5 Stages Per Drive Per College

1. **APPLICATIONS** - Initial stage, becomes ACTIVE on publish
2. **TEST** - Assessment/testing phase
3. **SHORTLIST** - Candidates shortlisted
4. **INTERVIEW** - Interview rounds
5. **FINAL** - Final selection

**Stage Statuses:**
- `NOT_STARTED` - Stage not yet begun
- `ACTIVE` - Currently active stage
- `COMPLETED` - Stage finished

---

## ✅ Features Implemented

### Company Features
- [x] Create drive (DRAFT status)
- [x] Publish drive (PUBLISHED status, activate APPLICATIONS)
- [x] View all own drives
- [x] View specific drive details
- [x] Assign drives to multiple colleges
- [x] Automatic stage initialization

### College Features
- [x] View own profile
- [x] Update own profile (name, city, state, tier)
- [x] View assigned drives
- [x] View drive details (if assigned)
- [x] See current active stage
- [x] See all stage statuses

### Technical Features
- [x] Clean MVC architecture
- [x] Service layer separation
- [x] Input validation
- [x] Role-based access control
- [x] Prisma transactions
- [x] Error handling
- [x] Standard response format

---

## 🚫 Not Implemented (As Per Requirements)

- ❌ Student upload
- ❌ Excel file handling
- ❌ File uploads (JD files)
- ❌ Stage transitions beyond publish
- ❌ Notifications
- ❌ Pagination
- ❌ Drive editing after publish
- ❌ Drive deletion

---

**Stage 4 Complete! ✅**
