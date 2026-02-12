# Application Engine API Documentation

## Overview
The Application Engine provides endpoints for managing student applications in campus placement drives.

## Base URL
```
http://localhost:5000/api/applications
```

## Authentication
All endpoints require JWT authentication in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Create Applications

**Endpoint:** `POST /:driveId/create`

**Description:** Creates applications for multiple students in a drive

**Authorization:** COLLEGE, ADMIN

**Request Body:**
```json
{
  "studentIds": ["student-uuid-1", "student-uuid-2", "student-uuid-3"],
  "collegeId": "college-uuid" // Required only for ADMIN role
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Applications created successfully",
  "data": {
    "created": 3
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Some students already have applications for this drive",
  "error": "Some students already have applications for this drive"
}
```

---

## 2. Get Applications by Drive

**Endpoint:** `GET /drive/:driveId`

**Description:** Retrieves all applications for a specific drive (grouped by college for companies)

**Authorization:** COMPANY, ADMIN

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `collegeId` (optional): Filter by specific college
- `status` (optional): Filter by application status
- `currentStage` (optional): Filter by current stage
- `search` (optional): Search by student name or email

**Response (200):**
```json
{
  "success": true,
  "message": "Applications fetched successfully",
  "data": {
    "applications": {
      "college-uuid-1": {
        "college": {
          "id": "college-uuid-1",
          "name": "Engineering College",
          "city": "Mumbai",
          "state": "Maharashtra"
        },
        "applications": [
          {
            "id": "app-uuid-1",
            "driveId": "drive-uuid-1",
            "studentId": "student-uuid-1",
            "collegeId": "college-uuid-1",
            "status": "APPLIED",
            "currentStage": "APPLICATIONS",
            "appliedAt": "2024-01-15T10:30:00.000Z",
            "student": {
              "id": "student-uuid-1",
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@college.edu",
              "phone": "+91 9876543210",
              "course": "Computer Engineering",
              "cgpa": 8.5
            }
          }
        ]
      }
    },
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    },
    "stats": {
      "total": 150,
      "byStatus": {
        "APPLIED": 100,
        "IN_TEST": 30,
        "SHORTLISTED": 20
      },
      "byStage": {
        "APPLICATIONS": 100,
        "TEST": 30,
        "SHORTLIST": 20
      },
      "byCollege": {
        "college-uuid-1": 50,
        "college-uuid-2": 100
      }
    }
  }
}
```

---

## 3. Get Applications by College

**Endpoint:** `GET /college/:driveId/:collegeId`

**Description:** Retrieves applications for a specific college in a drive

**Authorization:** COLLEGE, COMPANY, ADMIN

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by application status
- `currentStage` (optional): Filter by current stage
- `search` (optional): Search by student name or email

**Response (200):**
```json
{
  "success": true,
  "message": "Applications fetched successfully",
  "data": {
    "applications": [
      {
        "id": "app-uuid-1",
        "driveId": "drive-uuid-1",
        "studentId": "student-uuid-1",
        "collegeId": "college-uuid-1",
        "status": "APPLIED",
        "currentStage": "APPLICATIONS",
        "appliedAt": "2024-01-15T10:30:00.000Z",
        "student": {
          "id": "student-uuid-1",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@college.edu",
          "phone": "+91 9876543210",
          "course": "Computer Engineering",
          "cgpa": 8.5
        }
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

## 4. Get Application Statistics

**Endpoint:** `GET /stats/:driveId`

**Description:** Retrieves application statistics for a drive

**Authorization:** COMPANY, ADMIN

**Response (200):**
```json
{
  "success": true,
  "message": "Application stats fetched successfully",
  "data": {
    "total": 150,
    "byStatus": {
      "APPLIED": 100,
      "IN_TEST": 30,
      "SHORTLISTED": 15,
      "IN_INTERVIEW": 3,
      "SELECTED": 2,
      "REJECTED": 0
    },
    "byStage": {
      "APPLICATIONS": 100,
      "TEST": 30,
      "SHORTLIST": 15,
      "INTERVIEW": 3,
      "FINAL": 2
    },
    "byCollege": {
      "college-uuid-1": 50,
      "college-uuid-2": 100
    }
  }
}
```

---

## 5. Update Application Status

**Endpoint:** `PATCH /:applicationId/status`

**Description:** Updates the status of a specific application

**Authorization:** COMPANY, ADMIN

**Request Body:**
```json
{
  "status": "SHORTLISTED"
}
```

**Valid Status Transitions:**
- APPLIED → IN_TEST, REJECTED
- IN_TEST → SHORTLISTED, REJECTED
- SHORTLISTED → IN_INTERVIEW, REJECTED
- IN_INTERVIEW → SELECTED, REJECTED
- SELECTED → REJECTED
- REJECTED → (Final state, no transitions)

**Response (200):**
```json
{
  "success": true,
  "message": "Application status updated successfully",
  "data": {
    "id": "app-uuid-1",
    "driveId": "drive-uuid-1",
    "studentId": "student-uuid-1",
    "collegeId": "college-uuid-1",
    "status": "SHORTLISTED",
    "currentStage": "SHORTLIST",
    "appliedAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z",
    "student": {
      "id": "student-uuid-1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@college.edu"
    },
    "college": {
      "id": "college-uuid-1",
      "name": "Engineering College"
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid status transition from APPLIED to SELECTED",
  "error": "Invalid status transition from APPLIED to SELECTED"
}
```

---

## Security Rules

### Role-Based Access
- **COMPANY**: Can view applications for their drives only, can update application status
- **COLLEGE**: Can create applications for their students, can view their own students' applications only
- **ADMIN**: Can view all applications, can create and update applications

### Data Validation
- All student IDs must belong to the specified college
- Students must be linked to the drive before creating applications
- Duplicate applications are prevented
- Status transitions are validated to prevent skipping stages

### Performance Optimization
- All queries use proper database indexes
- Pagination is enforced for list endpoints
- Selective field loading to avoid over-fetching
- Search functionality uses database indexes

---

## Error Codes

| Status | Code | Description |
|---------|-------|-------------|
| 400 | Bad Request | Invalid input data or validation errors |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for the requested action |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error during processing |
