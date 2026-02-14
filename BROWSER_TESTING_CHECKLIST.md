# 🧪 BROWSER TESTING CHECKLIST

**Quick manual testing guide for Admin Dashboard**

---

## 🚀 PRE-TESTING SETUP

### Step 1: Start Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev
# Should run on http://localhost:5000

# Terminal 2: Frontend
cd apps/web
npm run dev
# Should run on http://localhost:5173
```

### Step 2: Login
```
URL: http://localhost:5173/login
Email: admin@freshbit.com
Password: Admin@123
```

**Verify:**
- [ ] Login succeeds
- [ ] Redirects to /admin
- [ ] No console errors (F12)
- [ ] JWT token in localStorage

---

## 📊 PART 1: ADMIN DASHBOARD

**URL:** `http://localhost:5173/admin`

### Quick Tests (5 min)

**Stats Cards:**
- [ ] 4 cards visible
- [ ] Numbers animate from 0
- [ ] Cards stagger in (watch carefully)
- [ ] Icons show correct colors

**Quick Actions:**
- [ ] Click "Add New College" → Modal opens
- [ ] Click "View All Drives" → Navigate to /admin/drives
- [ ] Click "View Analytics" → Navigate to /admin/analytics

**Recent Activity:**
- [ ] Timeline shows with dots
- [ ] Activities have icons
- [ ] Time shows (e.g., "2 hours ago")

**Active Drives:**
- [ ] Shows max 5 drives
- [ ] Click "View" → Navigate to drive details

**Console:**
- [ ] No red errors
- [ ] No 404s in Network tab

---

## 📋 PART 2: ALL DRIVES PAGE

**URL:** `http://localhost:5173/admin/drives`

### Quick Tests (10 min)

**Search:**
- [ ] Type in search box
- [ ] Wait 300ms (debounce)
- [ ] Table filters
- [ ] Clear button (X) appears

**Tabs:**
- [ ] Click "Active" → Shows only active drives
- [ ] Click "Completed" → Shows only completed
- [ ] Counts update

**Table:**
- [ ] Click "Drive Name" header → Sorts A-Z
- [ ] Click again → Sorts Z-A
- [ ] Arrow icon changes direction
- [ ] Hover row → Background changes

**Filters:**
- [ ] Click "Filters" button
- [ ] Panel slides in from right
- [ ] Select filters
- [ ] Click "Apply" → Table updates
- [ ] Click "Clear All" → Resets

**Bulk Selection:**
- [ ] Click checkbox on row → Selects
- [ ] Click header checkbox → Selects all
- [ ] Bulk action bar appears at bottom
- [ ] Click "Export" → Downloads CSV

**Pagination:**
- [ ] Click "Next" → Page 2
- [ ] Click "Previous" → Page 1
- [ ] Change items per page → Resets to page 1

**Console:**
- [ ] No errors

---

## 🏫 PART 3: MANAGE COLLEGES

**URL:** `http://localhost:5173/admin/colleges`

### Quick Tests (10 min)

**Add College:**
- [ ] Click "Add College" button
- [ ] Modal opens with animation
- [ ] Fill all fields
- [ ] Click "Generate" password → Password fills
- [ ] Click eye icon → Password shows/hides
- [ ] Submit empty → Shows errors
- [ ] Fill correctly → Click "Create College"
- [ ] Toast: "College created successfully"
- [ ] Modal closes
- [ ] Table refreshes

**Edit College:**
- [ ] Click "Edit" on any college
- [ ] Modal opens with data pre-filled
- [ ] NO password field visible
- [ ] Change name
- [ ] Click "Update College"
- [ ] Toast: "College updated successfully"

**Delete College:**
- [ ] Click "Delete" on any college
- [ ] Confirmation dialog appears
- [ ] Shows impact (students, drives)
- [ ] Click "Confirm Delete"
- [ ] Toast: "College deleted successfully"
- [ ] Table refreshes

**Search:**
- [ ] Type college name
- [ ] Wait 300ms
- [ ] Table filters

**Console:**
- [ ] No errors

---

## 📊 PART 4: ANALYTICS PAGE

**URL:** `http://localhost:5173/admin/analytics`

### Quick Tests (5 min)

**Charts:**
- [ ] Line chart renders (Applications Over Time)
- [ ] Hover on line → Tooltip shows
- [ ] Pie chart renders (Drives by Status)
- [ ] Center shows total count
- [ ] Legend shows at bottom

**Tables:**
- [ ] Top Colleges shows with ranks
- [ ] Selection rate calculated correctly
- [ ] Top Companies shows

**Export:**
- [ ] Click "Export Reports"
- [ ] CSV downloads
- [ ] Open CSV → Data is correct

**Console:**
- [ ] No errors

---

## 🔍 PART 5: DRIVE DETAILS

**URL:** Click any drive from All Drives table

### Quick Tests (5 min)

**Breadcrumb:**
- [ ] Shows: Admin > All Drives > {Drive Name}
- [ ] Click "Admin" → Navigate to /admin
- [ ] Click "All Drives" → Navigate to /admin/drives

**Drive Info:**
- [ ] All fields show correctly
- [ ] CTC formatted (₹20,00,000)
- [ ] Dates formatted

**Stage Progress:**
- [ ] 5 stages show
- [ ] Completed stages: green
- [ ] Active stage: blue
- [ ] Pending stages: gray

**Admin Actions:**
- [ ] Click "Activate Next Stage"
- [ ] Loading spinner shows
- [ ] Stage updates
- [ ] Click "Close Drive"
- [ ] Drive status changes to COMPLETED

**Charts:**
- [ ] Application stats pie chart renders

**Console:**
- [ ] No errors

---

## 📱 RESPONSIVE TESTING

### Mobile (375px)
**Open DevTools → Toggle Device Toolbar → iPhone SE**

- [ ] Dashboard: Stats stack vertically
- [ ] All Drives: Table scrolls horizontally
- [ ] Filter panel: Full screen
- [ ] Colleges: Table scrolls
- [ ] Analytics: Charts stack
- [ ] All text readable
- [ ] No horizontal scroll on page

### Tablet (768px)
**iPad**

- [ ] Dashboard: 2-column stats
- [ ] Tables fit without scroll
- [ ] Charts: 2 columns

---

## ⚡ PERFORMANCE TESTING

### Lighthouse Audit
**DevTools → Lighthouse → Run Audit**

Target Scores:
- [ ] Performance: > 90
- [ ] Accessibility: > 90
- [ ] Best Practices: > 90
- [ ] SEO: > 80

### Network Tab
- [ ] No duplicate API calls
- [ ] API calls complete < 1s
- [ ] No 404 errors

### Console
- [ ] No warnings
- [ ] No errors
- [ ] No memory leaks (check over time)

---

## 🎯 CRITICAL ISSUES TO WATCH FOR

### Must Fix Before Production:
1. **Console Errors**
   - Any red errors = FAIL
   - Fix immediately

2. **API Failures**
   - 500 errors = Backend issue
   - 401 errors = Auth issue
   - 404 errors = Route issue

3. **UI Breaks**
   - Layout shifts
   - Missing data
   - Broken animations

4. **Data Issues**
   - Wrong data displayed
   - Calculations incorrect
   - Filters not working

---

## ✅ PASS CRITERIA

**The dashboard PASSES if:**
- [ ] All pages load without errors
- [ ] All CRUD operations work
- [ ] Search, filter, sort work
- [ ] Pagination works
- [ ] Modals open/close smoothly
- [ ] Forms validate correctly
- [ ] Charts render correctly
- [ ] Animations are smooth
- [ ] Responsive on mobile/tablet
- [ ] No console errors
- [ ] Lighthouse scores > 90

**If all checked: ✅ PRODUCTION READY**

---

## 🐛 BUG REPORTING TEMPLATE

If you find issues, document them like this:

```
**Bug:** [Short description]
**Page:** [URL]
**Steps to Reproduce:**
1. Go to...
2. Click...
3. See error

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Console Error:** [Copy error message]
**Screenshot:** [If applicable]
**Priority:** Critical / High / Medium / Low
```

---

## 📊 TESTING RESULTS

**Date:** _____________  
**Tester:** _____________

### Summary:
- Total Tests: _____ / _____
- Passed: _____
- Failed: _____
- Critical Issues: _____

### Overall Status:
- [ ] ✅ PASS - Ready for Production
- [ ] ⚠️ CONDITIONAL PASS - Minor issues to fix
- [ ] ❌ FAIL - Critical issues found

### Notes:
_______________________________________
_______________________________________
_______________________________________

---

**Happy Testing! 🚀**
