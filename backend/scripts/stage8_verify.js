const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const http = require('http')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const app = require('../src/app')

const prisma = new PrismaClient()
const args = process.argv.slice(2)
const argMap = Object.fromEntries(args.map((a) => {
  const m = a.split('=')
  const k = (m[0] || '').replace(/^-+/, '')
  return [k, m[1] === undefined ? true : m[1]]
}))
const API_PORT = Number(argMap.usePort || process.env.PORT || 5000)

function makeToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
}

function request({ method, path, token, body }) {
  const payload = body ? JSON.stringify(body) : null
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (payload) headers['Content-Length'] = Buffer.byteLength(payload)
  const options = { hostname: 'localhost', port: API_PORT, path, method, headers }
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

async function resolveContext() {
  const [companyUser, collegeUser] = await Promise.all([
    prisma.user.findFirst({ where: { role: 'COMPANY' }, include: { company: true } }),
    prisma.user.findFirst({ where: { role: 'COLLEGE' }, include: { college: true } })
  ])
  if (!companyUser?.company || !collegeUser?.college) {
    throw new Error('Missing company/college profiles')
  }

  const tokens = { company: makeToken(companyUser), college: makeToken(collegeUser) }

  let driveId = argMap.driveId
  let collegeId = argMap.collegeId

  if (!driveId || !collegeId || argMap.forceNew) {
    const stamp = Date.now().toString().slice(-8)
    const drive = await prisma.drive.create({
      data: {
        companyId: companyUser.company.id,
        roleTitle: `Stage8 QA ${stamp}`,
        salary: 900000,
        description: `Stage8 progression verification ${stamp}`,
        status: 'PUBLISHED',
        currentStage: 'APPLICATIONS',
        isLocked: false
      }
    })
    await prisma.driveCollege.create({
      data: {
        driveId: drive.id,
        collegeId: collegeUser.college.id,
        invitationStatus: 'ACCEPTED',
        managedBy: 'COLLEGE'
      }
    })
    const studentsData = Array.from({ length: 5 }).map((_, idx) => ({
      firstName: `S8${idx}`,
      lastName: 'Candidate',
      email: `s8_${stamp}_${idx}@${collegeUser.college.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'college'}.test`,
      phone: `81000${String(idx).padStart(5, '0')}`,
      course: 'B.Tech',
      cgpa: 8.0,
      collegeId: collegeUser.college.id
    }))
    await prisma.student.createMany({ data: studentsData })
    const students = await prisma.student.findMany({
      where: { collegeId: collegeUser.college.id, email: { in: studentsData.map((s) => s.email) } },
      orderBy: { createdAt: 'asc' }
    })
    await prisma.driveStudent.createMany({
      data: students.map((student) => ({
        driveId: drive.id,
        collegeId: collegeUser.college.id,
        studentId: student.id
      }))
    })
    driveId = drive.id
    collegeId = collegeUser.college.id
  }

  return { driveId, collegeId, tokens }
}

async function run() {
  let server
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET missing in environment')
      process.exit(1)
    }
    if (!argMap.noServer) {
      server = await new Promise((resolve, reject) => {
        const instance = app.listen(API_PORT, () => resolve(instance))
        instance.on('error', reject)
      })
    }

    const ctx = await resolveContext()
    const { driveId, collegeId, tokens } = ctx

    const outputs = []

    const initRes = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/initialize`,
      token: tokens.company
    })
    outputs.push({ label: 'INIT', status: initRes.status, body: initRes.body })

    // Create applications after initialization
    const links = await prisma.driveStudent.findMany({
      where: { driveId, collegeId },
      select: { studentId: true },
      orderBy: { createdAt: 'asc' }
    })
    await request({
      method: 'POST',
      path: `/api/applications/${driveId}/create`,
      token: tokens.college,
      body: { studentIds: links.map(l => l.studentId) }
    })

    const progressRes1 = await request({
      method: 'GET',
      path: `/api/stages/drive/${driveId}/progress`,
      token: tokens.company
    })
    outputs.push({ label: 'PROGRESS', status: progressRes1.status, body: progressRes1.body })

    const completeRes = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/complete`,
      token: tokens.company
    })
    outputs.push({ label: 'COMPLETE', status: completeRes.status, body: completeRes.body })

    const nextRes = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/next`,
      token: tokens.company
    })
    outputs.push({ label: 'NEXT', status: nextRes.status, body: nextRes.body })

    const appsApplied = await prisma.application.findMany({
      where: { driveId, collegeId, status: 'APPLIED', currentStage: 'APPLICATIONS' },
      orderBy: { appliedAt: 'asc' },
      take: 5
    })
    const toProgress = appsApplied.slice(0, 4).map(a => a.id)
    const toReject = appsApplied.slice(4, 5).map(a => a.id)

    const moveRes = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/progress`,
      token: tokens.college,
      body: {
        collegeId,
        applicationIds: toProgress,
        targetStage: 'TEST'
      }
    })
    outputs.push({ label: 'MOVE_TEST', status: moveRes.status, body: moveRes.body })

    const skipRes = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/progress`,
      token: tokens.college,
      body: {
        collegeId,
        applicationIds: toReject,
        targetStage: 'INTERVIEW'
      }
    })
    outputs.push({ label: 'SKIP_FAIL', status: skipRes.status, body: skipRes.body })

    const rejectRes = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/reject`,
      token: tokens.company,
      body: { applicationIds: toReject }
    })
    outputs.push({ label: 'REJECT', status: rejectRes.status, body: rejectRes.body })

    const rejectedList = await request({
      method: 'GET',
      path: `/api/applications/drive/${driveId}?status=REJECTED`,
      token: tokens.company
    })
    outputs.push({ label: 'REJECTED_LIST', status: rejectedList.status, body: rejectedList.body })

    const progressBody = progressRes1.body?.data
    const stages = Array.isArray(progressBody?.stages) ? progressBody.stages : []
    const appsCounts = progressBody?.applicationCounts || {}

    const appsGrouped = rejectedList.body?.data?.applications
    const hasRejected = appsGrouped && typeof appsGrouped === 'object'
      ? Object.values(appsGrouped).some((g) => Array.isArray(g.applications) && g.applications.length >= 1)
      : Array.isArray(rejectedList.body?.data?.applications) && rejectedList.body.data.applications.length >= 1

    const verified = {
      initOk: initRes.status === 201 && Array.isArray(initRes.body?.data?.stages) && initRes.body?.data?.stages.length === 5,
      applicationsActive: stages[0]?.name === 'APPLICATIONS' && stages[0]?.status === 'ACTIVE',
      progressOk: progressRes1.status === 200 && appsCounts.APPLICATIONS >= 5 && progressBody?.completion >= 20,
      completeOk: completeRes.status === 200 && completeRes.body?.data?.stage?.name === 'APPLICATIONS' && completeRes.body?.data?.stage?.status === 'COMPLETED',
      nextOk: nextRes.status === 200 && nextRes.body?.data?.currentStage?.name === 'TEST' && nextRes.body?.data?.currentStage?.status === 'ACTIVE',
      driveStageOk: nextRes.body?.data?.drive?.currentStage === 'TEST',
      movedOk: moveRes.status === 200 && moveRes.body?.data?.updated === 4,
      statusUpdatedOk: (await prisma.application.count({ where: { id: { in: toProgress }, status: 'IN_TEST', currentStage: 'TEST' } })) === 4,
      skipFailOk: skipRes.status >= 400 && skipRes.body?.success === false,
      rejectOk: rejectRes.status === 200 && rejectRes.body?.data?.rejected === 1,
      rejectedListOk: rejectedList.status === 200 && hasRejected
    }

    const out = {
      driveId,
      collegeId,
      outputs,
      verified
    }
    fs.writeFileSync(path.join(__dirname, 'stage8_out.json'), JSON.stringify(out, null, 2))
  } catch (error) {
    console.error('Stage8 run error:', error && error.stack ? error.stack : (error.message || String(error)))
    process.exitCode = 1
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await prisma.$disconnect()
  }
}

run()
