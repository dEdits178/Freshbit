# Stage 5 — File Uploads & Preview Conversion

## Overview
- Adds secure file uploads for colleges per drive
- Lists and streams files with role-based access
- Optional conversion (CSV/XLSX) to preview-only table
- No student insertion, no auto-parsing, no stage modification
- Follows standardized responses, auth, role middleware, and service layer

## Prisma Changes
Updated `FileUpload` model with metadata and uploader relation:
- fileName: String
- fileSize: Int
- mimeType: String
- uploadedByUserId: String
- uploadedBy: User relation

Migration command:
```
npx prisma migrate dev --name file_upload_metadata
```

## Dependencies
Installed in backend:
- multer — file uploads
- xlsx — Excel parsing (preview only)
- csv-parse — CSV parsing (preview only)

## Module Structure
`src/modules/file/`
- file.middleware.js — Multer setup (+ extension/MIME restrictions, 10MB limit, /uploads dir)
- file.service.js — Business logic (access validation, save metadata, list, convert)
- file.controller.js — HTTP handlers returning standardized responses
- file.routes.js — Route definitions leveraging auth and role middleware

## Endpoints
1) Upload File (College)
- POST `/api/college/drives/:driveId/files/upload`
- Form-data: `file`, `fileType` (JD | STUDENT_LIST | SHORTLIST | FINAL_LIST)
- Access: COLLEGE, DriveCollege.invitationStatus = ACCEPTED
- Response: `{ success, message, data: { id, fileName, mimeType, fileSize, uploadedAt } }`

2) List Files (College)
- GET `/api/college/drives/:driveId/files`
- Access: COLLEGE

3) View/Download File (Secure Stream)
- GET `/api/files/:fileId`
- Access: College owning drive, Company owning drive, Admin

4) Convert to Table (Preview Only)
- POST `/api/college/files/:fileId/convert`
- Access: College who uploaded (uploadedByUserId), Admin if managedBy = ADMIN for DriveCollege
- Supported: CSV, XLSX/XLS
- Not supported: PDF/DOC/DOCX → error `"Conversion not supported for this file type yet"`
- Response: `{ success, data: { columns, rows, totalRows } }`

## Security & Rules
- Role-based access via auth + role middleware
- Uploads only stored; no automatic parsing
- Conversion is separate endpoint
- No database insertion of students
- Original file never deleted by conversion

## Testing (Postman)
1) Upload:
```
POST /api/college/drives/{driveId}/files/upload
Body: form-data → file=<choose>, fileType=STUDENT_LIST
Headers: Authorization: Bearer <COLLEGE_TOKEN>
```
2) List:
```
GET /api/college/drives/{driveId}/files
Headers: Authorization: Bearer <COLLEGE_TOKEN>
```
3) Download:
```
GET /api/files/{fileId}
Headers: Authorization: Bearer <TOKEN>
```
4) Convert:
```
POST /api/college/files/{fileId}/convert
Headers: Authorization: Bearer <COLLEGE_TOKEN>
```

## Code References
- Routes: `src/modules/file/file.routes.js`
- Controller: `src/modules/file/file.controller.js`
- Service: `src/modules/file/file.service.js`
- Multer: `src/modules/file/file.middleware.js`
- Registration: `src/app.js`

## Notes
- Backward compatibility preserved; existing modules unchanged
- Indices in Prisma schema support efficient lookups
