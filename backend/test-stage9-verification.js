const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const http = require('http')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const app = require('./src/app')

const prisma = new PrismaClient()

const API_PORT = Number(process.env.STAGE9_TEST_PORT || 5100)
const API_BASE = '/api/selection'
const STAGES = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL']

const ctx = {
  passed: 0,
  failed: 0,
  skipped: 0,
  createdDriveIds: []
}

function logPass(name, detail = '') {
  ctx.passed += 1
  console.log(`✅ PASS: ${name}${detail ? ` -> ${detail}` : ''}`)
}

function logFail(name, detail = '') {
  ctx.failed += 1
  console.log(`❌ FAIL: ${name}${detail ? ` -> ${detail}` : ''}`)
}

function logSkip(name, detail = '') {
  ctx.skipped += 1
  console.log(`⚠️ SKIP: ${name}${detail ? ` -> ${detail}` : ''}`)
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

async function createScenario({
  companyId,
  college,
  managedBy = 'COLLEGE',
  appCount = 20,
  currentStage = 'TEST',
  linkedCount = appCount
}) {
  const stamp = Date.now().toString().slice(-8)
  const drive = await prisma.drive.create({
    data: {
      companyId,
      roleTitle: `Stage9 QA ${stamp}`,
      salary: 1000000,
      description: `Stage9 verification scenario ${stamp}`,
      status: 'PUBLISHED',
      currentStage,
      isLocked: false
    }
  })
  ctx.createdDriveIds.push(drive.id)

  await prisma.stage.createMany({
    data: STAGES.map((name, i) => ({
      driveId: drive.id,
      name,
      order: i + 1,
      status: name === currentStage ? 'ACTIVE' : 'PENDING',
      startedAt: name === currentStage ? new Date() : null
    }))
  })

  const driveCollege = await prisma.driveCollege.create({
    data: {
      driveId: drive.id,
      collegeId: college.id,
      invitationStatus: 'ACCEPTED',
      managedBy
    }
  })

  const studentsData = Array.from({ length: appCount }).map((_, idx) => ({
    firstName: `S9${idx}`,
    lastName: 'Candidate',
    email: `s9_${stamp}_${idx}@${college.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'college'}.test`,
    phone: `90000${String(idx).padStart(5, '0')}`,
    course: 'B.Tech',
    cgpa: 8.0 + ((idx % 10) / 10),
    collegeId: college.id
  }))

  await prisma.student.createMany({ data: studentsData })

  const students = await prisma.student.findMany({
    where: { collegeId: college.id, email: { in: studentsData.map((s) => s.email) } },
    orderBy: { createdAt: 'asc' }
  })

  const linkedStudents = students.slice(0, linkedCount)

  await prisma.driveStudent.createMany({
    data: linkedStudents.map((student) => ({
      driveId: drive.id,
      collegeId: college.id,
      studentId: student.id
    }))
  })

  await prisma.application.createMany({
    data: linkedStudents.map((student) => ({
      driveId: drive.id,
      collegeId: college.id,
      studentId: student.id,
      status: currentStage === 'TEST' ? 'IN_TEST' : 'APPLIED',
      currentStage,
      stageHistory: [
        {
          action: 'STAGE_TRANSITION',
          fromStage: 'APPLICATIONS',
          toStage: currentStage,
          status: currentStage === 'TEST' ? 'IN_TEST' : 'APPLIED',
          by: 'SYSTEM',
          timestamp: new Date().toISOString()
        }
      ]
    }))
  })

  return {
    drive,
    driveCollege,
    students,
    linkedStudents,
    linkedEmails: linkedStudents.map((s) => s.email)
  }
}

async function expectStatus(name, response, expectedStatuses) {
  const ok = expectedStatuses.includes(response.status)
  assert(ok, name, `status=${response.status}, expected=${expectedStatuses.join('/')}`)
  return ok
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

    console.log('\n=== STAGE 9 VERIFICATION (SHORTLIST & FINAL ENGINE) ===\n')

    const [companyUser, adminUser, collegeUsers] = await Promise.all([
      prisma.user.findFirst({ where: { role: 'COMPANY', status: 'APPROVED', verified: true }, include: { company: true } }),
      prisma.user.findFirst({ where: { role: 'ADMIN', status: 'APPROVED', verified: true } }),
      prisma.user.findMany({ where: { role: 'COLLEGE', status: 'APPROVED', verified: true }, include: { college: true }, take: 5 })
    ])

    const primaryCollegeUser = collegeUsers.find((u) => u.college)
    const secondaryCollegeUser = collegeUsers.find((u) => u.college && u.id !== primaryCollegeUser?.id)

    if (!companyUser?.company || !adminUser || !primaryCollegeUser?.college) {
      throw new Error('Missing required approved users (company/admin/college)')
    }

    const tokens = {
      company: makeToken(companyUser),
      admin: makeToken(adminUser),
      college: makeToken(primaryCollegeUser),
      college2: secondaryCollegeUser ? makeToken(secondaryCollegeUser) : null
    }

    const primaryCollege = primaryCollegeUser.college

    // 1) PRE-CONDITIONS + main scenario
    const main = await createScenario({
      companyId: companyUser.company.id,
      college: primaryCollege,
      managedBy: 'COLLEGE',
      appCount: 24,
      currentStage: 'TEST',
      linkedCount: 20
    })

    const preDrive = await prisma.drive.findUnique({ where: { id: main.drive.id } })
    const preAppsInTest = await prisma.application.count({ where: { driveId: main.drive.id, collegeId: primaryCollege.id, currentStage: 'TEST' } })
    const preDc = await prisma.driveCollege.findUnique({ where: { driveId_collegeId: { driveId: main.drive.id, collegeId: primaryCollege.id } } })

    assert(preDrive && !preDrive.isLocked, 'Precondition: drive not locked')
    assert(preDrive && preDrive.currentStage === 'TEST', 'Precondition: drive currentStage = TEST')
    assert(preAppsInTest > 0, 'Precondition: TEST stage applications exist')
    assert(preDc && preDc.invitationStatus === 'ACCEPTED', 'Precondition: DriveCollege invitation ACCEPTED')
    assert(preDc && !!preDc.managedBy, 'Precondition: managedBy is set')

    // 2) SHORTLIST
    const shortlistEmails = main.linkedEmails.slice(0, 10)
    const shortlistRes = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: shortlistEmails }
    })
    await expectStatus('Shortlist upload success (TEST -> SHORTLIST)', shortlistRes, [200])

    const shortlistedApps = await prisma.application.findMany({
      where: { driveId: main.drive.id, student: { email: { in: shortlistEmails } } },
      include: { student: true }
    })
    assert(shortlistedApps.every((a) => a.status === 'SHORTLISTED' && a.currentStage === 'SHORTLIST'), 'Shortlist updates only TEST apps to SHORTLISTED/SHORTLIST')
    assert(shortlistedApps.every((a) => !!a.shortlistedAt && !!a.shortlistedBy), 'shortlistedAt and shortlistedBy populated')
    assert(shortlistedApps.every((a) => Array.isArray(a.stageHistory) && a.stageHistory.length >= 2), 'stageHistory appended on shortlist')

    const dcAfterShortlist = await prisma.driveCollege.findUnique({ where: { driveId_collegeId: { driveId: main.drive.id, collegeId: primaryCollege.id } } })
    assert(dcAfterShortlist.shortlistSubmitted === true, 'DriveCollege.shortlistSubmitted = true')
    assert(dcAfterShortlist.shortlistedCount === shortlistEmails.length, 'DriveCollege.shortlistedCount updated')

    await setDriveStage(main.drive.id, 'INTERVIEW')
    const shortlistWrongStage = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: [main.linkedEmails[11]] }
    })
    await expectStatus('Shortlist fails when stage != TEST', shortlistWrongStage, [400])

    await setDriveStage(main.drive.id, 'TEST')
    await prisma.drive.update({ where: { id: main.drive.id }, data: { isLocked: true } })
    const shortlistLocked = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: [main.linkedEmails[11]] }
    })
    await expectStatus('Shortlist fails on locked drive', shortlistLocked, [400])
    await prisma.drive.update({ where: { id: main.drive.id }, data: { isLocked: false } })

    const shortlistUnauthorizedRole = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/shortlist`,
      token: tokens.company,
      body: { collegeId: primaryCollege.id, studentEmails: [main.linkedEmails[11]] }
    })
    await expectStatus('Shortlist fails for unauthorized role (company)', shortlistUnauthorizedRole, [403])

    const shortlistDuplicateSubmit = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: [main.linkedEmails[11], main.linkedEmails[12]] }
    })
    await expectStatus('Shortlist duplicate submit blocked for non-admin', shortlistDuplicateSubmit, [409])

    // 3) INTERVIEW
    await setDriveStage(main.drive.id, 'SHORTLIST')
    const interviewEmails = shortlistEmails.slice(0, 6)
    const interviewRes = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/interview`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: interviewEmails }
    })
    await expectStatus('Interview upload success (SHORTLIST -> INTERVIEW)', interviewRes, [200])

    const interviewedApps = await prisma.application.findMany({
      where: { driveId: main.drive.id, student: { email: { in: interviewEmails } } }
    })
    assert(interviewedApps.every((a) => a.status === 'IN_INTERVIEW' && a.currentStage === 'INTERVIEW'), 'Interview transition updates status/stage')
    assert(interviewedApps.every((a) => !!a.interviewedAt && !!a.interviewedBy), 'interviewedAt/interviewedBy set')

    const dcAfterInterview = await prisma.driveCollege.findUnique({ where: { driveId_collegeId: { driveId: main.drive.id, collegeId: primaryCollege.id } } })
    assert(dcAfterInterview.interviewListSubmitted === true, 'DriveCollege.interviewListSubmitted = true')
    assert(dcAfterInterview.interviewedCount === interviewEmails.length, 'DriveCollege.interviewedCount updated')

    await setDriveStage(main.drive.id, 'TEST')
    const interviewWrongStage = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/interview`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: shortlistEmails.slice(6, 7) }
    })
    await expectStatus('Interview fails when stage != SHORTLIST', interviewWrongStage, [400])

    await setDriveStage(main.drive.id, 'SHORTLIST')
    const interviewNotShortlisted = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/interview`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [main.linkedEmails[15]] }
    })
    await expectStatus('Interview fails for app not in SHORTLIST', interviewNotShortlisted, [400])

    const interviewDuplicates = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/interview`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [shortlistEmails[6], shortlistEmails[6]] }
    })
    await expectStatus('Interview fails on duplicate emails in payload', interviewDuplicates, [400])

    const interviewUnauthorizedRole = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/interview`,
      token: tokens.company,
      body: { collegeId: primaryCollege.id, studentEmails: shortlistEmails.slice(6, 8) }
    })
    await expectStatus('Interview fails for unauthorized role (company)', interviewUnauthorizedRole, [403])

    // 4) FINALIZE
    await setDriveStage(main.drive.id, 'INTERVIEW')
    const finalEmails = interviewEmails.slice(0, 3)
    const finalizeRes = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/finalize`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: finalEmails }
    })
    await expectStatus('Finalize success (INTERVIEW -> FINAL)', finalizeRes, [200])

    const finalApps = await prisma.application.findMany({
      where: { driveId: main.drive.id, student: { email: { in: finalEmails } } }
    })
    assert(finalApps.every((a) => a.status === 'SELECTED' && a.currentStage === 'FINAL'), 'Finalize updates to SELECTED/FINAL')
    assert(finalApps.every((a) => !!a.selectedAt && !!a.selectedBy), 'selectedAt/selectedBy set')

    const dcAfterFinalize = await prisma.driveCollege.findUnique({ where: { driveId_collegeId: { driveId: main.drive.id, collegeId: primaryCollege.id } } })
    assert(dcAfterFinalize.finalized === true, 'DriveCollege.finalized = true after finalize')
    assert(!!dcAfterFinalize.finalizedAt && !!dcAfterFinalize.finalizedBy, 'finalizedAt/finalizedBy set')
    assert(dcAfterFinalize.selectedCount === finalEmails.length, 'DriveCollege.selectedCount updated')

    const finalizeAgain = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/finalize`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: [interviewEmails[4]] }
    })
    await expectStatus('Finalize fails when already finalized', finalizeAgain, [400, 409])

    await setDriveStage(main.drive.id, 'TEST')
    const finalizeWrongStage = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/finalize`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [interviewEmails[3]] }
    })
    await expectStatus('Finalize fails if drive stage != INTERVIEW', finalizeWrongStage, [400])

    await setDriveStage(main.drive.id, 'INTERVIEW')
    await prisma.drive.update({ where: { id: main.drive.id }, data: { isLocked: true } })
    const finalizeLocked = await request({
      method: 'POST',
      path: `${API_BASE}/${main.drive.id}/finalize`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [interviewEmails[3]] }
    })
    await expectStatus('Finalize fails when drive locked', finalizeLocked, [400])
    await prisma.drive.update({ where: { id: main.drive.id }, data: { isLocked: false } })

    // 5) BULK REJECT
    const rejectScenario = await createScenario({
      companyId: companyUser.company.id,
      college: primaryCollege,
      managedBy: 'COLLEGE',
      appCount: 12,
      currentStage: 'TEST',
      linkedCount: 12
    })

    const rejectEmails = rejectScenario.linkedEmails.slice(0, 4)
    const rejectRes = await request({
      method: 'POST',
      path: `${API_BASE}/${rejectScenario.drive.id}/reject`,
      token: tokens.company,
      body: { collegeId: primaryCollege.id, studentEmails: rejectEmails, currentStage: 'TEST' }
    })
    await expectStatus('Bulk reject success', rejectRes, [200])

    const rejectedApps = await prisma.application.findMany({
      where: { driveId: rejectScenario.drive.id, student: { email: { in: rejectEmails } } }
    })
    assert(rejectedApps.every((a) => a.status === 'REJECTED' && !!a.rejectedAt && !!a.rejectedBy), 'Rejected metadata set and status updated')
    assert(rejectedApps.every((a) => Array.isArray(a.stageHistory) && a.stageHistory.some((h) => h.action === 'REJECTED')), 'Rejection appended to stageHistory')

    const rejectUnauthorized = await request({
      method: 'POST',
      path: `${API_BASE}/${rejectScenario.drive.id}/reject`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: [rejectScenario.linkedEmails[5]], currentStage: 'TEST' }
    })
    await expectStatus('Reject fails for unauthorized college role', rejectUnauthorized, [403])

    const rejectWrongStageApp = await request({
      method: 'POST',
      path: `${API_BASE}/${rejectScenario.drive.id}/reject`,
      token: tokens.company,
      body: { collegeId: primaryCollege.id, studentEmails: [rejectScenario.linkedEmails[5]], currentStage: 'INTERVIEW' }
    })
    await expectStatus('Reject fails when app not in specified stage', rejectWrongStageApp, [400])

    const shortlistRejected = await request({
      method: 'POST',
      path: `${API_BASE}/${rejectScenario.drive.id}/shortlist`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [rejectEmails[0]] }
    })
    await expectStatus('Rejected app cannot be progressed later', shortlistRejected, [400])

    // 6) EMAIL VALIDATION
    const validationScenario = await createScenario({
      companyId: companyUser.company.id,
      college: primaryCollege,
      managedBy: 'COLLEGE',
      appCount: 8,
      currentStage: 'TEST',
      linkedCount: 6
    })
    const validEmail = validationScenario.linkedEmails[0]
    const unlinkedEmail = validationScenario.students[7].email
    const missingEmail = `missing_${Date.now()}@none.test`
    const countBeforeValidation = await prisma.application.count({ where: { driveId: validationScenario.drive.id } })

    const validationRes = await request({
      method: 'POST',
      path: `${API_BASE}/${validationScenario.drive.id}/validate-emails`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, emails: [validEmail, unlinkedEmail, missingEmail] }
    })
    await expectStatus('Validate emails endpoint success', validationRes, [200])

    const validList = validationRes.body?.data?.valid || []
    const invalidList = validationRes.body?.data?.invalid || []
    assert(validList.includes(validEmail.toLowerCase()), 'Validate endpoint marks linked college student as valid')
    assert(invalidList.some((x) => x.email === unlinkedEmail.toLowerCase() && x.reason === 'NOT_LINKED_TO_DRIVE'), 'Validate endpoint marks unlinked email invalid')
    assert(invalidList.some((x) => x.email === missingEmail.toLowerCase() && x.reason === 'NOT_FOUND_IN_COLLEGE'), 'Validate endpoint marks missing college email invalid')

    const countAfterValidation = await prisma.application.count({ where: { driveId: validationScenario.drive.id } })
    assert(countBeforeValidation === countAfterValidation, 'Validate endpoint does not mutate DB rows')

    // 7) DUPLICATE PROTECTION (same upload twice)
    const duplicateScenario = await createScenario({
      companyId: companyUser.company.id,
      college: primaryCollege,
      managedBy: 'COLLEGE',
      appCount: 10,
      currentStage: 'TEST',
      linkedCount: 10
    })
    const dupEmails = duplicateScenario.linkedEmails.slice(0, 4)
    const firstDupUpload = await request({
      method: 'POST',
      path: `${API_BASE}/${duplicateScenario.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: dupEmails }
    })
    await expectStatus('Duplicate protection baseline upload success', firstDupUpload, [200])

    const secondDupUpload = await request({
      method: 'POST',
      path: `${API_BASE}/${duplicateScenario.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: dupEmails }
    })
    await expectStatus('Duplicate protection blocks second shortlist upload', secondDupUpload, [409])

    const dupCount = await prisma.application.count({ where: { driveId: duplicateScenario.drive.id, status: 'SHORTLISTED' } })
    assert(dupCount === dupEmails.length, 'No duplicate transitions / no double count on repeated upload')

    // 8) COLLEGE CLOSE OPERATION
    const closeScenario = await createScenario({
      companyId: companyUser.company.id,
      college: primaryCollege,
      managedBy: 'COLLEGE',
      appCount: 6,
      currentStage: 'TEST',
      linkedCount: 6
    })
    const closeRes = await request({
      method: 'POST',
      path: `${API_BASE}/${closeScenario.drive.id}/close`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id }
    })
    await expectStatus('Close college operation success', closeRes, [200])

    const dcClosed = await prisma.driveCollege.findUnique({ where: { driveId_collegeId: { driveId: closeScenario.drive.id, collegeId: primaryCollege.id } } })
    assert(dcClosed.finalized === true && !!dcClosed.finalizedAt, 'Close operation sets finalized + finalizedAt')

    const closeAgain = await request({
      method: 'POST',
      path: `${API_BASE}/${closeScenario.drive.id}/close`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id }
    })
    await expectStatus('Close operation fails if already closed', closeAgain, [409])

    const closeUnauthorized = await request({
      method: 'POST',
      path: `${API_BASE}/${closeScenario.drive.id}/close`,
      token: tokens.company,
      body: { collegeId: primaryCollege.id }
    })
    await expectStatus('Close operation unauthorized role fails', closeUnauthorized, [403])

    const closeShortlistAfter = await request({
      method: 'POST',
      path: `${API_BASE}/${closeScenario.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: [closeScenario.linkedEmails[0]] }
    })
    await expectStatus('No shortlist allowed after close', closeShortlistAfter, [409])

    // 9) STAGE ENFORCEMENT
    const stageScenario = await createScenario({
      companyId: companyUser.company.id,
      college: primaryCollege,
      managedBy: 'COLLEGE',
      appCount: 8,
      currentStage: 'TEST',
      linkedCount: 8
    })

    await setDriveStage(stageScenario.drive.id, 'INTERVIEW')
    const shortlistDuringInterview = await request({
      method: 'POST',
      path: `${API_BASE}/${stageScenario.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: [stageScenario.linkedEmails[0]] }
    })
    await expectStatus('Stage enforcement: shortlist during INTERVIEW fails', shortlistDuringInterview, [400])

    await setDriveStage(stageScenario.drive.id, 'TEST')
    const finalizeDuringTest = await request({
      method: 'POST',
      path: `${API_BASE}/${stageScenario.drive.id}/finalize`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [stageScenario.linkedEmails[0]] }
    })
    await expectStatus('Stage enforcement: finalize during TEST fails', finalizeDuringTest, [400])

    const interviewBeforeShortlist = await request({
      method: 'POST',
      path: `${API_BASE}/${stageScenario.drive.id}/interview`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [stageScenario.linkedEmails[0]] }
    })
    await expectStatus('Stage enforcement: interview before shortlist fails', interviewBeforeShortlist, [400])

    // 10) LOCKED DRIVE BEHAVIOR
    await setDriveStage(stageScenario.drive.id, 'FINAL')
    await prisma.drive.update({ where: { id: stageScenario.drive.id }, data: { isLocked: true } })

    const lockedShortlist = await request({
      method: 'POST',
      path: `${API_BASE}/${stageScenario.drive.id}/shortlist`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [stageScenario.linkedEmails[1]] }
    })
    await expectStatus('Locked drive blocks shortlist', lockedShortlist, [400])

    const lockedInterview = await request({
      method: 'POST',
      path: `${API_BASE}/${stageScenario.drive.id}/interview`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [stageScenario.linkedEmails[1]] }
    })
    await expectStatus('Locked drive blocks interview', lockedInterview, [400])

    const lockedFinalize = await request({
      method: 'POST',
      path: `${API_BASE}/${stageScenario.drive.id}/finalize`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [stageScenario.linkedEmails[1]] }
    })
    await expectStatus('Locked drive blocks finalize', lockedFinalize, [400])

    const lockedReject = await request({
      method: 'POST',
      path: `${API_BASE}/${stageScenario.drive.id}/reject`,
      token: tokens.company,
      body: { collegeId: primaryCollege.id, studentEmails: [stageScenario.linkedEmails[1]], currentStage: 'TEST' }
    })
    await expectStatus('Locked drive blocks reject', lockedReject, [400])

    // 11) managedBy ENFORCEMENT
    const adminManaged = await createScenario({
      companyId: companyUser.company.id,
      college: primaryCollege,
      managedBy: 'ADMIN',
      appCount: 8,
      currentStage: 'TEST',
      linkedCount: 8
    })

    const collegeOnAdminManaged = await request({
      method: 'POST',
      path: `${API_BASE}/${adminManaged.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: [adminManaged.linkedEmails[0]] }
    })
    await expectStatus('managedBy=ADMIN blocks college shortlist', collegeOnAdminManaged, [403])

    const adminOnAdminManaged = await request({
      method: 'POST',
      path: `${API_BASE}/${adminManaged.drive.id}/shortlist`,
      token: tokens.admin,
      body: { collegeId: primaryCollege.id, studentEmails: [adminManaged.linkedEmails[0], adminManaged.linkedEmails[1]] }
    })
    await expectStatus('managedBy=ADMIN allows admin shortlist', adminOnAdminManaged, [200])

    const companyOnCollegeManaged = await request({
      method: 'POST',
      path: `${API_BASE}/${stageScenario.drive.id}/shortlist`,
      token: tokens.company,
      body: { collegeId: primaryCollege.id, studentEmails: [stageScenario.linkedEmails[2]] }
    })
    await expectStatus('managedBy=COLLEGE blocks company shortlist', companyOnCollegeManaged, [403])

    if (!secondaryCollegeUser) {
      logSkip('Cross-college managedBy enforcement', 'No second approved college user found in DB')
    } else {
      const otherCollegeFinalize = await request({
        method: 'POST',
        path: `${API_BASE}/${main.drive.id}/finalize`,
        token: tokens.college2,
        body: { collegeId: primaryCollege.id, studentEmails: [interviewEmails[3]] }
      })
      await expectStatus('Cross-college finalize forbidden', otherCollegeFinalize, [403, 409])
    }

    logSkip('managedBy=COMPANY case', 'Schema enum currently supports only COLLEGE/ADMIN')

    // 12) BULK TRANSACTION SAFETY (50+ emails)
    const bulkScenario = await createScenario({
      companyId: companyUser.company.id,
      college: primaryCollege,
      managedBy: 'COLLEGE',
      appCount: 60,
      currentStage: 'TEST',
      linkedCount: 55
    })

    const bulkEmails = bulkScenario.linkedEmails.slice(0, 50)
    const invalidBulkEmail = bulkScenario.students[59].email // not linked to drive

    const beforeBulkShortlisted = await prisma.application.count({ where: { driveId: bulkScenario.drive.id, status: 'SHORTLISTED' } })

    const bulkRes = await request({
      method: 'POST',
      path: `${API_BASE}/${bulkScenario.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: [...bulkEmails, invalidBulkEmail] }
    })
    await expectStatus('Bulk shortlist with partial invalid set fails atomically', bulkRes, [400])

    const afterBulkShortlisted = await prisma.application.count({ where: { driveId: bulkScenario.drive.id, status: 'SHORTLISTED' } })
    const dcBulk = await prisma.driveCollege.findUnique({ where: { driveId_collegeId: { driveId: bulkScenario.drive.id, collegeId: primaryCollege.id } } })
    assert(beforeBulkShortlisted === afterBulkShortlisted, 'Bulk failure caused no partial app updates')
    assert(dcBulk.shortlistedCount === 0 && dcBulk.shortlistSubmitted === false, 'Bulk failure kept DriveCollege counters consistent')

    // make a valid bulk success call to ensure 50+ works
    const bulkSuccess = await request({
      method: 'POST',
      path: `${API_BASE}/${bulkScenario.drive.id}/shortlist`,
      token: tokens.college,
      body: { collegeId: primaryCollege.id, studentEmails: bulkEmails }
    })
    await expectStatus('Bulk shortlist with 50 emails succeeds', bulkSuccess, [200])

    // 13) STATS ENDPOINT
    const statsRes = await request({
      method: 'GET',
      path: `${API_BASE}/${main.drive.id}/stats?collegeId=${primaryCollege.id}`,
      token: tokens.admin
    })
    await expectStatus('Stats endpoint success', statsRes, [200])

    const dbByStatus = await prisma.application.groupBy({
      by: ['status'],
      where: { driveId: main.drive.id, collegeId: primaryCollege.id },
      _count: { _all: true }
    })
    const dbStatusMap = dbByStatus.reduce((acc, row) => {
      acc[row.status] = row._count._all
      return acc
    }, {})

    const apiByStatus = statsRes.body?.data?.byStatus || {}
    assert((apiByStatus.SELECTED || 0) === (dbStatusMap.SELECTED || 0), 'Stats byStatus.SELECTED accurate')
    assert((apiByStatus.IN_INTERVIEW || 0) === (dbStatusMap.IN_INTERVIEW || 0), 'Stats byStatus.IN_INTERVIEW accurate')

    const statsFinalized = statsRes.body?.data?.metadata?.finalizedColleges
    assert(typeof statsFinalized === 'number' && statsFinalized >= 0, 'Stats finalizedColleges returned as non-negative number')

    // 14) PAGINATION ENDPOINTS
    const shortlistPage = await request({
      method: 'GET',
      path: `${API_BASE}/${bulkScenario.drive.id}/shortlisted?collegeId=${primaryCollege.id}&page=1&limit=10`,
      token: tokens.admin
    })
    await expectStatus('Pagination shortlisted endpoint success', shortlistPage, [200])
    assert((shortlistPage.body?.data?.applications || []).length <= 10, 'Shortlisted endpoint respects limit')

    const interviewPage = await request({
      method: 'GET',
      path: `${API_BASE}/${main.drive.id}/interview?collegeId=${primaryCollege.id}&page=1&limit=5`,
      token: tokens.admin
    })
    await expectStatus('Pagination interview endpoint success', interviewPage, [200])
    assert((interviewPage.body?.data?.applications || []).length <= 5, 'Interview endpoint respects limit')

    const finalPageForCompany = await request({
      method: 'GET',
      path: `${API_BASE}/${main.drive.id}/final?page=1&limit=10`,
      token: tokens.company
    })
    await expectStatus('Pagination final endpoint success', finalPageForCompany, [200])
    const companyFinalApps = finalPageForCompany.body?.data?.applications
    assert(companyFinalApps && !Array.isArray(companyFinalApps), 'Company final endpoint returns grouped view object')

    // 15) STAGE HISTORY AUDIT
    const auditedApp = await prisma.application.findFirst({
      where: { driveId: main.drive.id, student: { email: finalEmails[0] } }
    })
    const history = Array.isArray(auditedApp?.stageHistory) ? auditedApp.stageHistory : []
    const hasShortlist = history.some((h) => h.toStage === 'SHORTLIST')
    const hasInterview = history.some((h) => h.toStage === 'INTERVIEW')
    const hasFinal = history.some((h) => h.toStage === 'FINAL')
    assert(hasShortlist && hasInterview && hasFinal, 'Stage history keeps full TEST->SHORTLIST->INTERVIEW->FINAL timeline')

    console.log('\n=== STAGE 9 VERIFICATION SUMMARY ===')
    console.log(`Passed: ${ctx.passed}`)
    console.log(`Failed: ${ctx.failed}`)
    console.log(`Skipped: ${ctx.skipped}`)
    console.log(`Created drives: ${ctx.createdDriveIds.length}`)

    if (ctx.failed > 0) {
      process.exitCode = 1
    }
  } catch (error) {
    console.error('Fatal Stage 9 verification error:', error)
    process.exitCode = 1
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await prisma.$disconnect()
  }
}

run()
