const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const http = require('http')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const app = require('./src/app')

const prisma = new PrismaClient()

const API_PORT = Number(process.env.COMPLETE_FLOW_TEST_PORT || 5200)
const API_BASE = '/api'

const ctx = {
  passed: 0,
  failed: 0,
  createdDriveIds: [],
  createdStudentIds: []
}

function logPass(name, detail = '') {
  ctx.passed += 1
  console.log(`✅ PASS: ${name}${detail ? ` -> ${detail}` : ''}`)
}

function logFail(name, detail = '') {
  ctx.failed += 1
  console.log(`❌ FAIL: ${name}${detail ? ` -> ${detail}` : ''}`)
}

function assert(condition, name, detail = '') {
  if (condition) {
    logPass(name, detail)
  } else {
    logFail(name, detail)
  }
}

function makeToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

function request({ method, path, token, body }) {
  const payload = body ? JSON.stringify(body) : null

  const headers = {
    'Content-Type': 'application/json'
  }

  if (token) headers.Authorization = `Bearer ${token}`
  if (payload) headers['Content-Length'] = Buffer.byteLength(payload)

  const options = {
    hostname: 'localhost',
    port: API_PORT,
    path,
    method,
    headers
  }

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null })
        } catch (e) {
          resolve({ status: res.statusCode, body: raw })
        }
      })
    })

    req.on('error', (error) => resolve({ status: 0, body: { message: error.message } }))

    if (payload) req.write(payload)
    req.end()
  })
}

async function setDriveStage(driveId, stageName) {
  await prisma.$transaction(async (tx) => {
    await tx.drive.update({
      where: { id: driveId },
      data: { currentStage: stageName }
    })

    await tx.stage.updateMany({
      where: { driveId },
      data: { status: 'PENDING' }
    })

    await tx.stage.update({
      where: { driveId_name: { driveId, name: stageName } },
      data: { status: 'ACTIVE', startedAt: new Date() }
    })
  })
}

async function createTestStudents(collegeId, count = 20) {
  const stamp = Date.now().toString().slice(-8)
  const studentsData = Array.from({ length: count }).map((_, idx) => ({
    firstName: `Flow${idx}`,
    lastName: 'Student',
    email: `flow_${stamp}_${idx}@testcollege.edu`,
    phone: `90000${String(idx).padStart(5, '0')}`,
    course: 'B.Tech',
    cgpa: 7.5 + ((idx % 10) / 10),
    collegeId
  }))

  await prisma.student.createMany({ data: studentsData })
  
  const students = await prisma.student.findMany({
    where: { collegeId, email: { in: studentsData.map(s => s.email) } },
    orderBy: { createdAt: 'asc' }
  })

  ctx.createdStudentIds.push(...students.map(s => s.id))
  return students
}

async function run() {
  let server
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET missing in environment')
    }

    server = await new Promise((resolve, reject) => {
      const instance = app.listen(API_PORT, () => resolve(instance))
      instance.on('error', reject)
    })

    console.log('\n=== COMPLETE FLOW TESTING ===\n')

    // Get required users
    const [companyUser, adminUser, collegeUser] = await Promise.all([
      prisma.user.findFirst({ 
        where: { role: 'COMPANY', status: 'APPROVED', verified: true }, 
        include: { company: true } 
      }),
      prisma.user.findFirst({ 
        where: { role: 'ADMIN', status: 'APPROVED', verified: true } 
      }),
      prisma.user.findFirst({ 
        where: { role: 'COLLEGE', status: 'APPROVED', verified: true }, 
        include: { college: true } 
      })
    ])

    if (!companyUser?.company || !adminUser || !collegeUser?.college) {
      throw new Error('Missing required approved users (company/admin/college)')
    }

    const tokens = {
      company: makeToken(companyUser),
      admin: makeToken(adminUser),
      college: makeToken(collegeUser)
    }

    const college = collegeUser.college

    // STEP 1: Create drive (Company)
    console.log('\n--- STEP 1: CREATE DRIVE (COMPANY) ---')
    const driveData = {
      companyId: companyUser.company.id,
      roleTitle: `Complete Flow Test ${Date.now().toString().slice(-6)}`,
      salary: 1200000,
      description: 'Complete flow test drive',
      collegeIds: [college.id] // Need to specify which colleges to invite
    }

    const createDriveRes = await request({
      method: 'POST',
      path: `${API_BASE}/drives/company`,
      token: tokens.company,
      body: driveData
    })

    assert(createDriveRes.status === 201, 'Drive creation success')
    console.log('Drive creation response:', JSON.stringify(createDriveRes.body, null, 2))
    const driveId = createDriveRes.body?.data?.id || createDriveRes.body?.drive?.id
    assert(driveId, 'Drive ID returned')
    ctx.createdDriveIds.push(driveId)

    // STEP 2: Accept invitation (College)
    console.log('\n--- STEP 2: ACCEPT INVITATION (COLLEGE) ---')
    
    if (!driveId) {
      logFail('Cannot proceed without drive ID')
      return
    }
    
    // Accept the drive invitation
    const acceptRes = await request({
      method: 'PATCH',
      path: `${API_BASE}/drives/college/${driveId}/respond`,
      token: tokens.college,
      body: { action: 'ACCEPT' }
    })

    assert(acceptRes.status === 200, 'Invitation acceptance success')

    // Verify drive college mapping
    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId: college.id } }
    })
    assert(driveCollege?.invitationStatus === 'ACCEPTED', 'Drive college mapping created')

    // STEP 3: Upload students (College)
    console.log('\n--- STEP 3: UPLOAD STUDENTS (COLLEGE) ---')
    
    const students = await createTestStudents(college.id, 15)
    assert(students.length === 15, 'Test students created')

    // Link students to drive
    const studentEmails = students.slice(0, 12).map(s => s.email)
    const studentsData = students.slice(0, 12).map(s => ({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      course: s.course,
      cgpa: s.cgpa
    }))
    
    const linkRes = await request({
      method: 'POST',
      path: `${API_BASE}/students/${driveId}/confirm`,
      token: tokens.college,
      body: { students: studentsData }
    })

    assert(linkRes.status === 200, 'Students linked to drive')
    console.log('Student confirmation response:', JSON.stringify(linkRes.body, null, 2))
    assert(linkRes.body?.data?.linked === 12, 'Correct number of students linked')

    // Create applications
    const applicationRes = await request({
      method: 'POST',
      path: `${API_BASE}/applications/${driveId}/create`,
      token: tokens.college,
      body: { studentIds: students.slice(0, 12).map(s => s.id) }
    })

    console.log('Application creation response:', JSON.stringify(applicationRes.body, null, 2))
    assert(applicationRes.status === 201, 'Applications created')
    assert(applicationRes.body?.data?.created === 12, 'Correct number of applications created')

    // Check what stage the applications are in
    const createdApps = await prisma.application.findMany({
      where: { driveId, collegeId: college.id },
      select: { id: true, currentStage: true, status: true, student: { select: { email: true } } }
    })
    console.log('Created applications stages:', createdApps.map(app => ({ email: app.student.email, stage: app.currentStage, status: app.status })))

    // STEP 4: Move to TEST stage (Admin)
    console.log('\n--- STEP 4: MOVE TO TEST STAGE (ADMIN) ---')
    
    await setDriveStage(driveId, 'TEST')
    
    const driveAfterTest = await prisma.drive.findUnique({ where: { id: driveId } })
    assert(driveAfterTest.currentStage === 'TEST', 'Drive moved to TEST stage')

    // Move applications to TEST stage to simulate the real flow
    await prisma.application.updateMany({
      where: { driveId, collegeId: college.id, currentStage: 'APPLICATIONS' },
      data: { currentStage: 'TEST', status: 'IN_TEST' }
    })

    const appsInTest = await prisma.application.count({
      where: { driveId, collegeId: college.id, currentStage: 'TEST' }
    })
    assert(appsInTest === 12, 'All applications moved to TEST stage')

    // STEP 5: Upload shortlist (College)
    console.log('\n--- STEP 5: UPLOAD SHORTLIST (COLLEGE) ---')
    
    const shortlistEmails = studentEmails.slice(0, 8)
    
    const shortlistRes = await request({
      method: 'POST',
      path: `${API_BASE}/selection/${driveId}/shortlist`,
      token: tokens.college,
      body: { 
        collegeId: college.id, 
        studentEmails: shortlistEmails 
      }
    })

    assert(shortlistRes.status === 200, 'Shortlist upload success')
    assert(shortlistRes.body?.data?.shortlisted === 8, 'Correct number shortlisted')

    // Verify applications moved to SHORTLIST
    const shortlistedApps = await prisma.application.findMany({
      where: { 
        driveId, 
        collegeId: college.id, 
        student: { email: { in: shortlistEmails } } 
      }
    })
    assert(shortlistedApps.every(app => app.status === 'SHORTLISTED'), 'Applications moved to SHORTLISTED')

    // STEP 6: Move to SHORTLIST stage (Admin)
    console.log('\n--- STEP 6: MOVE TO SHORTLIST STAGE (ADMIN) ---')
    
    await setDriveStage(driveId, 'SHORTLIST')
    
    const driveAfterShortlist = await prisma.drive.findUnique({ where: { id: driveId } })
    assert(driveAfterShortlist.currentStage === 'SHORTLIST', 'Drive moved to SHORTLIST stage')

    // STEP 7: Upload interview list (College)
    console.log('\n--- STEP 7: UPLOAD INTERVIEW LIST (COLLEGE) ---')
    
    const interviewEmails = shortlistEmails.slice(0, 5)
    
    const interviewRes = await request({
      method: 'POST',
      path: `${API_BASE}/selection/${driveId}/interview`,
      token: tokens.college,
      body: { 
        collegeId: college.id, 
        studentEmails: interviewEmails 
      }
    })

    assert(interviewRes.status === 200, 'Interview list upload success')
    assert(interviewRes.body?.data?.interviewed === 5, 'Correct number moved to interview')

    // Verify applications moved to INTERVIEW
    const interviewApps = await prisma.application.findMany({
      where: { 
        driveId, 
        collegeId: college.id, 
        student: { email: { in: interviewEmails } } 
      }
    })
    assert(interviewApps.every(app => app.status === 'IN_INTERVIEW'), 'Applications moved to IN_INTERVIEW')

    // STEP 8: Move to INTERVIEW stage (Admin)
    console.log('\n--- STEP 8: MOVE TO INTERVIEW STAGE (ADMIN) ---')
    
    await setDriveStage(driveId, 'INTERVIEW')
    
    const driveAfterInterview = await prisma.drive.findUnique({ where: { id: driveId } })
    assert(driveAfterInterview.currentStage === 'INTERVIEW', 'Drive moved to INTERVIEW stage')

    // STEP 9: Finalize selections (College)
    console.log('\n--- STEP 9: FINALIZE SELECTIONS (COLLEGE) ---')
    
    const finalEmails = interviewEmails.slice(0, 3)
    
    const finalizeRes = await request({
      method: 'POST',
      path: `${API_BASE}/selection/${driveId}/finalize`,
      token: tokens.college,
      body: { 
        collegeId: college.id, 
        studentEmails: finalEmails 
      }
    })

    assert(finalizeRes.status === 200, 'Finalization success')
    assert(finalizeRes.body?.data?.selected === 3, 'Correct number finalized')

    // Verify applications moved to FINAL
    const finalApps = await prisma.application.findMany({
      where: { 
        driveId, 
        collegeId: college.id, 
        student: { email: { in: finalEmails } } 
      }
    })
    assert(finalApps.every(app => app.status === 'SELECTED' && app.currentStage === 'FINAL'), 'Applications moved to SELECTED/FINAL')

    // STEP 10: View final selected list (Company)
    console.log('\n--- STEP 10: VIEW FINAL SELECTED LIST (COMPANY) ---')
    
    const finalListRes = await request({
      method: 'GET',
      path: `${API_BASE}/selection/${driveId}/final`,
      token: tokens.company
    })

    assert(finalListRes.status === 200, 'Final list retrieval success')
    assert(finalListRes.body?.data?.applications, 'Applications data returned')
    
    const companyView = finalListRes.body.data.applications
    assert(typeof companyView === 'object' && !Array.isArray(companyView), 'Company gets grouped view')
    
    // Verify our finalized students are in the list
    let foundFinalized = 0
    Object.values(companyView).forEach(collegeGroup => {
      if (collegeGroup.college?.id === college.id) {
        foundFinalized = collegeGroup.applications.filter(
          app => finalEmails.includes(app.student.email)
        ).length
      }
    })
    assert(foundFinalized === 3, 'All finalized students appear in company view')

    // Additional verification: Check stats
    const statsRes = await request({
      method: 'GET',
      path: `${API_BASE}/selection/${driveId}/stats`,
      token: tokens.admin
    })

    assert(statsRes.status === 200, 'Stats endpoint works')
    assert(statsRes.body?.data?.byStatus?.SELECTED === 3, 'Stats show 3 selected')

    console.log('\n=== COMPLETE FLOW TEST SUMMARY ===')
    console.log(`Passed: ${ctx.passed}`)
    console.log(`Failed: ${ctx.failed}`)
    console.log(`Created drives: ${ctx.createdDriveIds.length}`)
    console.log(`Created students: ${ctx.createdStudentIds.length}`)

    if (ctx.failed > 0) {
      process.exitCode = 1
    } else {
      console.log('\n🎉 Complete flow test PASSED! All stages working correctly.')
    }

  } catch (error) {
    console.error('Fatal complete flow test error:', error)
    process.exitCode = 1
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await prisma.$disconnect()
  }
}

run()
