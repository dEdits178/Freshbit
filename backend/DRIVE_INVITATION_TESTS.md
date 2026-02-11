# Drive Invitation & Acceptance Workflow - Postman Tests

## Prerequisites
- Server running on http://localhost:5000
- Admin, Company, and College users created and approved

## Authentication Tokens (Replace with actual tokens)

### Admin Token
```
Authorization: Bearer <admin_jwt_token>
```

### Company Token  
```
Authorization: Bearer <company_jwt_token>
```

### College Token
```
Authorization: Bearer <college_jwt_token>
```

---

## TEST 1: Create Drive (Company)

**Endpoint:** `POST /api/drives/company`

**Headers:**
```
Authorization: Bearer <company_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "roleTitle": "Software Engineer",
  "salary": 1200000,
  "description": "Full stack development role",
  "collegeIds": ["<college_id_1>", "<college_id_2>"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drive created successfully",
  "data": {
    "id": "<drive_id>",
    "roleTitle": "Software Engineer",
    "salary": 1200000,
    "status": "DRAFT",
    "driveColleges": [
      {
        "id": "<drive_college_id>",
        "invitationStatus": "PENDING",
        "managedBy": null,
        "startedAt": null,
        "college": {
          "id": "<college_id>",
          "name": "College Name"
        }
      }
    ]
  }
}
```

---

## TEST 2: Publish Drive (Company)

**Endpoint:** `PATCH /api/drives/company/<drive_id>/publish`

**Headers:**
```
Authorization: Bearer <company_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drive published successfully",
  "data": {
    "id": "<drive_id>",
    "status": "PUBLISHED",
    "driveColleges": [
      {
        "invitationStatus": "PENDING",
        "managedBy": null,
        "startedAt": null
      }
    ]
  }
}
```

---

## TEST 3: Get College Drives (Should show PENDING invitations)

**Endpoint:** `GET /api/college/drives`

**Headers:**
```
Authorization: Bearer <college_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drives retrieved successfully",
  "data": [
    {
      "id": "<drive_id>",
      "roleTitle": "Software Engineer",
      "status": "PUBLISHED",
      "invitationStatus": "PENDING",
      "managedBy": null,
      "startedAt": null,
      "company": {
        "name": "Company Name"
      }
    }
  ]
}
```

---

## TEST 4: College Accepts Drive Invitation

**Endpoint:** `PATCH /api/drives/college/<drive_id>/respond`

**Headers:**
```
Authorization: Bearer <college_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "action": "ACCEPT"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drive accepted successfully",
  "data": {
    "id": "<drive_college_id>",
    "invitationStatus": "ACCEPTED",
    "managedBy": "COLLEGE",
    "startedAt": "2026-02-11T18:30:00.000Z",
    "drive": {
      "id": "<drive_id>",
      "roleTitle": "Software Engineer"
    },
    "college": {
      "id": "<college_id>",
      "name": "College Name"
    }
  }
}
```

---

## TEST 5: College Rejects Drive Invitation

**Endpoint:** `PATCH /api/drives/college/<drive_id>/respond`

**Headers:**
```
Authorization: Bearer <college_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "action": "REJECT"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drive rejected successfully",
  "data": {
    "id": "<drive_college_id>",
    "invitationStatus": "REJECTED",
    "managedBy": null,
    "startedAt": null
  }
}
```

---

## TEST 6: Try to Accept Already Accepted Drive (Should Fail)

**Endpoint:** `PATCH /api/drives/college/<drive_id>/respond`

**Headers:**
```
Authorization: Bearer <college_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "action": "ACCEPT"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Drive has already been accepted",
  "error": "Drive has already been accepted"
}
```

---

## TEST 7: Try to Respond After Rejection (Should Fail)

**Endpoint:** `PATCH /api/drives/college/<drive_id>/respond`

**Headers:**
```
Authorization: Bearer <college_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "action": "ACCEPT"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Drive has already been rejected",
  "error": "Drive has already been rejected"
}
```

---

## TEST 8: Admin Force Accept Drive

**Endpoint:** `PATCH /api/drives/admin/<drive_id>/colleges/<college_id>/override`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "action": "FORCE_ACCEPT"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drive force accepted successfully",
  "data": {
    "id": "<drive_college_id>",
    "invitationStatus": "ACCEPTED",
    "managedBy": "ADMIN",
    "startedAt": "2026-02-11T18:35:00.000Z"
  }
}
```

---

## TEST 9: Admin Reject Drive

**Endpoint:** `PATCH /api/drives/admin/<drive_id>/colleges/<college_id>/override`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "action": "REJECT"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drive rejected successfully",
  "data": {
    "id": "<drive_college_id>",
    "invitationStatus": "REJECTED",
    "managedBy": null,
    "startedAt": null
  }
}
```

---

## TEST 10: Get Company Drives (Should show invitation status)

**Endpoint:** `GET /api/drives/company`

**Headers:**
```
Authorization: Bearer <company_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drives retrieved successfully",
  "data": [
    {
      "id": "<drive_id>",
      "roleTitle": "Software Engineer",
      "status": "PUBLISHED",
      "driveColleges": [
        {
          "college": {
            "id": "<college_id>",
            "name": "College Name"
          },
          "invitationStatus": "ACCEPTED",
          "managedBy": "COLLEGE",
          "startedAt": "2026-02-11T18:30:00.000Z"
        },
        {
          "college": {
            "id": "<college_id_2>",
            "name": "College Name 2"
          },
          "invitationStatus": "PENDING",
          "managedBy": null,
          "startedAt": null
        }
      ]
    }
  ]
}
```

---

## TEST 11: College Drives After Rejection (Should not show rejected)

**Endpoint:** `GET /api/college/drives`

**Headers:**
```
Authorization: Bearer <college_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Drives retrieved successfully",
  "data": [
    // Only drives with invitationStatus != REJECTED should appear
    {
      "id": "<drive_id>",
      "roleTitle": "Software Engineer",
      "invitationStatus": "ACCEPTED",
      "managedBy": "COLLEGE",
      "startedAt": "2026-02-11T18:30:00.000Z"
    }
    // Rejected drives should NOT appear in this list
  ]
}
```

---

## Edge Cases & Validation Tests

### TEST 12: Invalid Action (College)
**Body:** `{ "action": "INVALID" }`
**Expected:** 400 - "Action must be either ACCEPT or REJECT"

### TEST 13: Missing Action (College)
**Body:** `{}`
**Expected:** 400 - "Action is required"

### TEST 14: Invalid Action (Admin)
**Body:** `{ "action": "INVALID" }`
**Expected:** 400 - "Action must be either FORCE_ACCEPT or REJECT"

### TEST 15: Non-existent Drive ID
**Endpoint:** `PATCH /api/drives/college/non-existent-id/respond`
**Expected:** 404 - "Drive not found"

### TEST 16: Unauthorized Access
**Endpoint:** `PATCH /api/drives/admin/<drive_id>/colleges/<college_id>/override`
**Headers:** `Authorization: Bearer <college_jwt_token>`
**Expected:** 403 - "Access denied"

---

## Success Criteria

✅ Drive creation sets invitationStatus = PENDING  
✅ Drive publishing doesn't auto-activate stages  
✅ College can ACCEPT invitation → status = ACCEPTED, managedBy = COLLEGE  
✅ College can REJECT invitation → status = REJECTED  
✅ ACCEPT activates APPLICATIONS stage  
✅ Admin can FORCE_ACCEPT → status = ACCEPTED, managedBy = ADMIN  
✅ Admin can REJECT → status = REJECTED  
✅ Safety rules prevent duplicate actions  
✅ College drives list excludes REJECTED drives  
✅ All endpoints include invitation fields in responses  
✅ Proper validation and error handling
