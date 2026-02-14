# College Dashboard Verification Checklist

**Date:** 2026-02-14  
**Phase:** 10.4 - College Dashboard  
**Status:** Ready for Manual Testing

---

## ✅ PRE-VERIFICATION CHECKS

### Backend Setup
- [x] College routes registered in `app.js`
- [x] College module exists (`backend/src/modules/college/`)
- [x] Backend server running on port 5000
- [ ] College API endpoints responding (test with Postman/curl)

### Frontend Setup
- [x] All 5 pages created (CollegeDashboard, Invitations, DriveDetails, UploadStudents, ViewStudents)
- [x] All 2 components created (InvitationCard, StudentPreviewTable)
- [x] College service layer created (`collegeService.js`)
- [x] Common components created (Badge, Input, Tooltip)
- [x] Routes registered in App.jsx
- [x] Frontend server running on port 5173

### Test Account
- **Email:** college@freshbit.com
- **Password:** College@123
- [ ] Account exists in database
- [ ] Account has test data (invitations, drives, students)

---

## 📋 PART 1: LOGIN & AUTHENTICATION

### Login Flow
```
URL: http://localhost:5173/login
```

- [ ] Page loads without errors
- [ ] Email and password fields visible
- [ ] Enter: college@freshbit.com / College@123
- [ ] Click Login button
- [ ] Loading state shows
- [ ] Login succeeds
- [ ] JWT token stored in localStorage/cookies
- [ ] Redirects to `/college`
- [ ] No console errors

**Common Issues:**
- If login fails: Check backend logs
- If redirect fails: Check ProtectedRoute component
- If blank page: Check browser console for errors

---

## 📊 PART 2: COLLEGE DASHBOARD

### URL: `http://localhost:5173/college`

### 2.1 Page Load & Header
- [ ] Welcome message displays: "Welcome, [College Name]! 👋"
- [ ] Organization name from user profile shows
- [ ] Subtitle: "Manage your placement drives and student data"
- [ ] No loading flicker
- [ ] Page animates in smoothly
- [ ] No console errors

**Expected Behavior:**
- Smooth fade-in animation
- Header appears first, then stats cards stagger in

### 2.2 Stats Cards Section

**Card 1: Pending Invitations (Orange)**
- [ ] Mail icon with orange background
- [ ] Title: "Pending Invitations"
- [ ] Value displays correctly
- [ ] If > 5: Shows "Action needed!" trend
- [ ] If > 0: Badge with count visible
- [ ] Card is clickable
- [ ] Click → navigates to `/college/invitations`
- [ ] Hover: card lifts with shadow

**Card 2: Accepted Drives (Blue)**
- [ ] Briefcase icon with blue background
- [ ] Title: "Accepted Drives"
- [ ] Value correct
- [ ] Clickable → `/college/invitations?tab=accepted`
- [ ] Hover effects work

**Card 3: Students Uploaded (Purple)**
- [ ] GraduationCap icon with purple background
- [ ] Title: "Students Uploaded"
- [ ] Value formatted with commas (e.g., "1,234")
- [ ] Hover effects work

**Card 4: Final Selections (Green)**
- [ ] CheckCircle icon with green background
- [ ] Title: "Final Selections"
- [ ] Value correct
- [ ] If > 0: Shows trend "X students placed"
- [ ] Hover effects work

**Animation Test:**
- [ ] Cards stagger in (100ms delay between each)
- [ ] Smooth 60fps animation
- [ ] Runs only once on mount

### 2.3 Pending Invitations Section

**Header:**
- [ ] Title: "Pending Invitations"
- [ ] Badge with count if > 0 (orange background)
- [ ] "View All" button if > 5 invitations

**If No Pending Invitations:**
- [ ] Empty state shows
- [ ] Mail icon (gray)
- [ ] Message: "No pending invitations"
- [ ] Sub-message: "You're all caught up! New invitations will appear here."

**If Has Pending Invitations:**

Each Invitation Card (Compact Mode):
- [ ] Company name (bold)
- [ ] Role (gray text)
- [ ] CTC formatted (e.g., ₹20,00,000)
- [ ] Location with MapPin icon
- [ ] Time ago (e.g., "2 hours ago")
- [ ] Accept button (primary, green)
- [ ] Reject button (ghost)
- [ ] Card has border and shadow
- [ ] Hover effect

**Accept Button Test:**
1. [ ] Click "Accept" on first invitation
2. [ ] Loading state appears (spinner in button)
3. [ ] Button disabled during process
4. [ ] On success:
   - [ ] Toast: "Invitation accepted successfully!"
   - [ ] Card disappears from pending list
   - [ ] Accepted count in stats updates
   - [ ] Page refreshes data

**Reject Button Test:**
1. [ ] Click "Reject" on second invitation
2. [ ] Loading state shows
3. [ ] On success:
   - [ ] Toast: "Invitation rejected"
   - [ ] Card disappears
   - [ ] Pending count decreases

### 2.4 Quick Actions Section
- [ ] Title: "Quick Actions"
- [ ] 3 action cards visible
- [ ] Card 1: Review Invitations (orange icon)
- [ ] Card 2: Manage Drives (blue icon)
- [ ] Card 3: View Analytics (green icon, "Coming soon")
- [ ] All cards clickable
- [ ] Hover effects work

### 2.5 Responsive Design

**Mobile (375px):**
- [ ] Stats: 1 column
- [ ] Invitation cards: full width
- [ ] All text readable
- [ ] No horizontal scroll

**Tablet (768px):**
- [ ] Stats: 2 columns
- [ ] Layout stacks properly

**Desktop (1440px):**
- [ ] Stats: 4 columns
- [ ] Proper spacing

---

## 📋 PART 3: INVITATIONS PAGE

### URL: `http://localhost:5173/college/invitations`

### 3.1 Page Header
- [ ] Title: "Drive Invitations"
- [ ] Subtitle visible
- [ ] Clean layout

### 3.2 Tabs
- [ ] Tab 1: "Pending" with badge count
- [ ] Tab 2: "Accepted" with badge count
- [ ] Tab 3: "Rejected" with badge count
- [ ] Active tab: underline + bold + primary color
- [ ] Default active: Pending
- [ ] Click: smooth transition

### 3.3 Search Bar
- [ ] Placeholder: "Search by company name or role..."
- [ ] Search icon on left
- [ ] Debounced 300ms
- [ ] Filters invitations in real-time

### 3.4 Pending Tab Content

**Each Invitation Card (Full Mode):**
- [ ] Status badge (top-right): "PENDING" (orange)
- [ ] Company name (text-2xl, bold)
- [ ] Role (text-lg, gray)
- [ ] CTC badge (large, green background)
- [ ] Location with MapPin icon
- [ ] Description (line-clamp-3)
- [ ] "Read more" button (expands description)
- [ ] Eligibility section (blue background)
- [ ] Start/End dates formatted
- [ ] Managed By badge (purple)
- [ ] Invited date (time ago)
- [ ] Reject button (ghost, full width)
- [ ] Accept button (primary, full width)

### 3.5 Accept Confirmation Dialog

**Test Flow:**
1. [ ] Click "Accept Invitation"
2. [ ] Dialog opens with backdrop
3. [ ] Title: "Accept Invitation?"
4. [ ] Drive details shown
5. [ ] Checkbox: "I confirm our students meet the eligibility criteria"
6. [ ] Checkbox unchecked by default
7. [ ] Confirm button disabled until checkbox checked
8. [ ] Check checkbox → Confirm button enables
9. [ ] Click Confirm → Loading state
10. [ ] On success:
    - [ ] Toast: "Invitation accepted!"
    - [ ] Dialog closes
    - [ ] Card moves to Accepted tab
    - [ ] Counts update

### 3.6 Reject Confirmation Dialog

**Test Flow:**
1. [ ] Click "Reject" button
2. [ ] Dialog opens
3. [ ] Title: "Reject Invitation?"
4. [ ] Warning message
5. [ ] Optional textarea for reason
6. [ ] Reject button (danger, red)
7. [ ] Cancel button
8. [ ] Click Reject → Loading state
9. [ ] On success:
    - [ ] Toast: "Invitation rejected"
    - [ ] Card moves to Rejected tab
    - [ ] Counts update

### 3.7 Accepted Tab
- [ ] Click "Accepted" tab
- [ ] Shows accepted invitations
- [ ] Status badge: "ACCEPTED" (green)
- [ ] Action buttons: "View Drive" and "Upload Students"
- [ ] Click "View Drive" → Navigate to drive details
- [ ] Click "Upload Students" → Navigate to upload page

### 3.8 Rejected Tab
- [ ] Shows rejected invitations
- [ ] Status badge: "REJECTED" (red)
- [ ] Shows rejection reason if provided
- [ ] No action buttons

---

## 🔍 PART 4: DRIVE DETAILS

### URL: `http://localhost:5173/college/drives/:id`

### 4.1 Page Header
- [ ] Breadcrumb: Back to drives
- [ ] Drive role (large title)
- [ ] Company name below
- [ ] Status badge
- [ ] Managed By badge

### 4.2 Drive Information Card
- [ ] Title: "Drive Information"
- [ ] CTC formatted (green, large)
- [ ] Location with icon
- [ ] Start/End dates formatted
- [ ] Description displayed
- [ ] Eligibility criteria (blue box)

### 4.3 Stage Progress Stepper
- [ ] 5 stages visible: APPLICATIONS → TEST → SHORTLIST → INTERVIEW → FINAL
- [ ] Completed stages: green circle + checkmark
- [ ] Active stage: blue circle + pulsing
- [ ] Pending stages: gray circle
- [ ] Connecting lines show progress

### 4.4 Current Action Section

**Test Different Stages:**

**APPLICATIONS Stage - No Students:**
- [ ] Title: "Upload Students"
- [ ] Description explains action
- [ ] "Upload Students" button (primary, large)
- [ ] Click → Navigate to upload page

**APPLICATIONS Stage - Students Uploaded:**
- [ ] Title: "Students Uploaded ✓"
- [ ] Success message with count
- [ ] "View Students" button
- [ ] "Upload More Students" button

### 4.5 Student Statistics Card
- [ ] Total Students Uploaded count
- [ ] Applications Submitted count
- [ ] Stage breakdown visible
- [ ] Color-coded stats

---

## 📤 PART 5: UPLOAD STUDENTS

### URL: `http://localhost:5173/college/drives/:id/upload-students`

### 5.1 Step 1: Upload File

**Instructions Card:**
- [ ] Title: "How to Upload Students"
- [ ] 4 numbered steps visible
- [ ] Clear, readable

**Download Template:**
- [ ] "Download CSV Template" button prominent
- [ ] Click → Downloads file
- [ ] File name: `student_template.csv`
- [ ] File contains correct columns

**Required Columns List:**
- [ ] All 7 columns listed
- [ ] Each with description
- [ ] Clear formatting

**File Upload Component:**
- [ ] Drag-and-drop zone
- [ ] "Drag & drop your file here" text
- [ ] "or click to browse" text
- [ ] Accept: `.csv, .xlsx`
- [ ] Max size: 10MB

**Upload States:**
- [ ] Default: dashed border, upload icon
- [ ] Drag Over: primary border, background changes
- [ ] File Selected: green background, file name shows, checkmark

**Preview Button:**
- [ ] Disabled until file selected
- [ ] Enables when file selected
- [ ] Click → Upload + show preview

**Test File Upload:**
1. [ ] No file: Preview button disabled
2. [ ] Invalid file type (.txt): Error message
3. [ ] File > 10MB: Error message
4. [ ] Valid CSV: File displays, button enables
5. [ ] Click Preview: Loading state, transitions to Step 2

### 5.2 Step 2: Preview & Confirm

**Summary Stats Card:**
- [ ] Total Rows count
- [ ] Valid Rows count (green)
- [ ] Invalid Rows count (red)
- [ ] Progress bar shows valid %

**Preview Table:**
- [ ] Shows first 100 rows
- [ ] Scrollable (max-height: 400px)
- [ ] Fixed header (sticky)
- [ ] All columns visible
- [ ] Valid rows: green checkmark
- [ ] Invalid rows: red X + red background

**Error Tooltips:**
- [ ] Hover over red X → tooltip appears
- [ ] Shows all errors for that row
- [ ] Tooltip dismisses on mouse leave

**If Invalid Rows:**
- [ ] Errors section shows (red background)
- [ ] List of errors displayed
- [ ] "Download Error Report" button
- [ ] "Fix and Re-upload" button
- [ ] Confirm button DISABLED

**If All Valid:**
- [ ] Confirm button ENABLED
- [ ] Click "Confirm & Insert Students"
- [ ] Loading state: spinner + progress text
- [ ] On success:
  - [ ] Toast: "X students uploaded successfully!"
  - [ ] Navigate to students page

---

## 📚 PART 6: VIEW STUDENTS

### URL: `http://localhost:5173/college/drives/:id/students`

### 6.1 Page Header
- [ ] Breadcrumb visible
- [ ] Title: "Uploaded Students"
- [ ] Total count badge
- [ ] "Upload More" button (if applicable)
- [ ] "Export" button

### 6.2 Search & Filters

**Search:**
- [ ] Placeholder: "Search by name, email, or roll number..."
- [ ] Search icon
- [ ] Debounced 300ms
- [ ] Filters table in real-time

**Filters:**
- [ ] Branch dropdown (All Branches, CS, IT, etc.)
- [ ] Status dropdown (All, Not Applied, Applied, etc.)
- [ ] Clear Filters button (when filters active)

**Test Filters:**
1. [ ] Search "rahul" → filters correctly
2. [ ] Select branch "Computer Science" → filters
3. [ ] Select status "Applied" → filters
4. [ ] Click "Clear Filters" → resets all

### 6.3 Student Table

**Table Header:**
- [ ] All columns visible: Name, Email, Phone, Roll No, Branch, CGPA, Year, Status, Actions
- [ ] Sortable columns have arrows
- [ ] Clean styling

**Sortable Columns:**
- [ ] Name: Click → A-Z, click again → Z-A
- [ ] Roll No: ascending/descending
- [ ] Branch: alphabetically
- [ ] CGPA: low to high / high to low
- [ ] Arrow shows direction

**Data Rows:**
- [ ] Hover: background changes
- [ ] All data displays correctly
- [ ] Status badges color-coded
- [ ] Actions dropdown works

**Status Badges:**
- [ ] Not Applied: gray
- [ ] Applied: blue
- [ ] In Test: yellow
- [ ] Shortlisted: purple
- [ ] In Interview: orange
- [ ] Selected: green
- [ ] Rejected: red

**Remove Student:**
1. [ ] Click Remove from actions
2. [ ] Confirmation dialog opens
3. [ ] Warning message
4. [ ] If applied: Cannot remove message
5. [ ] Click Confirm → API call
6. [ ] On success:
   - [ ] Toast: "Student removed successfully"
   - [ ] Row disappears
   - [ ] Count updates

### 6.4 Pagination
- [ ] Previous/Next buttons
- [ ] Page numbers (1, 2, 3, ...)
- [ ] Current page highlighted
- [ ] "Showing X-Y of Z" text
- [ ] Navigation works correctly

### 6.5 Export
- [ ] "Export Students" button
- [ ] Click → Downloads CSV
- [ ] File name: `students_[driveId]_[timestamp].csv`
- [ ] Includes filtered data
- [ ] All columns included

---

## 🧩 PART 7: COMPONENTS

### InvitationCard
- [ ] Full mode displays all fields
- [ ] Compact mode shows essential info
- [ ] Expandable description works
- [ ] Action buttons functional

### StudentPreviewTable
- [ ] Shows all columns
- [ ] Valid/invalid highlighting works
- [ ] Error tooltips display
- [ ] Scrollable
- [ ] Summary footer correct

---

## ⚙️ PART 8: SERVICE LAYER

**Test in Browser Console:**
```javascript
import * as collegeService from './services/collegeService';

// Test each function
await collegeService.getStats();
await collegeService.getInvitations('PENDING');
await collegeService.acceptInvitation('uuid');
await collegeService.uploadStudentFile(driveId, file);
await collegeService.confirmStudents(driveId, students);
await collegeService.downloadTemplate();
```

- [ ] All functions return correct data
- [ ] Error handling works
- [ ] Proper response format
- [ ] No console errors

---

## 🚨 PART 9: ERROR HANDLING

### Network Errors
**Test:** Stop backend server

- [ ] Dashboard: Shows error toast
- [ ] Invitations: Error toast appears
- [ ] Upload: Error handling works
- [ ] No unhandled promise rejections
- [ ] Graceful degradation

### File Upload Errors
- [ ] Invalid file type: Error message
- [ ] Large file: Error message
- [ ] Invalid CSV format: Error message

### Validation Errors
- [ ] Empty name → Error shows
- [ ] Invalid email → Error shows
- [ ] CGPA > 10 → Error shows
- [ ] Duplicate email → Error shows
- [ ] Phone not 10 digits → Error shows

---

## 📱 PART 10: RESPONSIVE DESIGN

### Mobile (375px)
- [ ] Dashboard: Stats 1 column
- [ ] Invitations: Cards full width
- [ ] Upload: File upload full width
- [ ] Students: Table horizontal scroll
- [ ] Touch targets ≥ 44px

### Tablet (768px)
- [ ] Dashboard: Stats 2 columns
- [ ] Cards: Comfortable width
- [ ] Tables: Fit without scroll

### Desktop (1440px)
- [ ] Stats: 4 columns
- [ ] Proper max-width
- [ ] Centered content
- [ ] Optimal layout

---

## ✅ FINAL ACCEPTANCE CRITERIA

### MUST PASS (CRITICAL):
- [ ] All 5 pages load without errors
- [ ] Dashboard shows correct stats
- [ ] Invitations can be accepted/rejected
- [ ] File upload works (CSV/XLSX)
- [ ] Preview validation accurate
- [ ] Students insert successfully
- [ ] Student table displays and filters
- [ ] Search and filters work
- [ ] Export functionality works
- [ ] All modals/dialogs work
- [ ] Stage progression correct
- [ ] Responsive on all devices
- [ ] No console errors
- [ ] Professional design
- [ ] Smooth animations

### ENTERPRISE FEATURES:
- [ ] Clear pending actions
- [ ] Step-by-step workflows
- [ ] Data validation emphasis
- [ ] Error messages helpful
- [ ] Loading states everywhere
- [ ] Empty states designed
- [ ] Confirmation dialogs
- [ ] Professional academic feel

### CODE QUALITY:
- [ ] Clean, readable code
- [ ] Reusable components
- [ ] Proper error handling
- [ ] Service layer properly used
- [ ] No code duplication
- [ ] Helpful comments

---

## 📝 TESTING NOTES

**Date:** ___________  
**Tester:** ___________  
**Browser:** ___________  
**Screen Size:** ___________

### Issues Found:
1. 
2. 
3. 

### Overall Assessment:
- [ ] PASS - Ready for production
- [ ] PASS WITH MINOR ISSUES - List issues above
- [ ] FAIL - Major issues found

**Notes:**
