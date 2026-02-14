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
const API_PORT = Number(argMap.usePort || process.env.PORT || process.env.STAGE7_TEST_PORT || 5101)

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

async function createStage7Scenario(companyId, college, count = 5) {
  const stamp = Date.now().toString().slice(-8)
  const drive = await prisma.drive.create({
    data: {
      companyId,
      roleTitle: `Stage7 QA ${stamp}`,
      salary: 900000,
      description: `Stage7 applications verification ${stamp}`,
      status: 'PUBLISHED',
      currentStage: 'APPLICATIONS',
      isLocked: false
    }
  })
  await prisma.stage.createMany({
    data: ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL'].map((name, i) => ({
      driveId: drive.id,
      name,
      order: i + 1,
      status: name === 'APPLICATIONS' ? 'ACTIVE' : 'PENDING',
      startedAt: name === 'APPLICATIONS' ? new Date() : null
    }))
  })
  await prisma.driveCollege.create({
    data: {
      driveId: drive.id,
      collegeId: college.id,
      invitationStatus: 'ACCEPTED',
      managedBy: 'COLLEGE'
    }
  })
  const studentsData = Array.from({ length: count }).map((_, idx) => ({
    firstName: `S7${idx}`,
    lastName: 'Candidate',
    email: `s7_${stamp}_${idx}@${college.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'college'}.test`,
    phone: `80000${String(idx).padStart(5, '0')}`,
    course: 'B.Tech',
    cgpa: 8.0,
    collegeId: college.id
  }))
  await prisma.student.createMany({ data: studentsData })
  const students = await prisma.student.findMany({
    where: { collegeId: college.id, email: { in: studentsData.map((s) => s.email) } },
    orderBy: { createdAt: 'asc' }
  })
  await prisma.driveStudent.createMany({
    data: students.map((student) => ({
      driveId: drive.id,
      collegeId: college.id,
      studentId: student.id
    }))
  })
  return { drive, students }
}

async function getExistingContext(driveId, collegeId, takeCount = 5) {
  const college = await prisma.college.findUnique({ where: { id: collegeId } })
  const drive = await prisma.drive.findUnique({ where: { id: driveId } })
  if (!college || !drive) return null
  const links = await prisma.driveStudent.findMany({
    where: { driveId, collegeId },
    select: { studentId: true },
    take: takeCount
  })
  const students = await prisma.student.findMany({
    where: { id: { in: links.map((l) => l.studentId) } },
    orderBy: { createdAt: 'asc' }
  })
  return { drive, students, college }
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
    const [companyUser, collegeUser] = await Promise.all([
      prisma.user.findFirst({ where: { role: 'COMPANY', status: 'APPROVED', verified: true }, include: { company: true } }),
      prisma.user.findFirst({ where: { role: 'COLLEGE', status: 'APPROVED', verified: true }, include: { college: true } })
    ])
    if (!companyUser?.company || !collegeUser?.college) {
      console.error('Missing approved company/college users')
      process.exit(1)
    }
    const tokens = { company: makeToken(companyUser), college: makeToken(collegeUser) }
    const driveIdArg = argMap.driveId
    const collegeIdArg = argMap.collegeId
    let ctx = null
    if (driveIdArg && collegeIdArg) {
      ctx = await getExistingContext(driveIdArg, collegeIdArg, Number(argMap.count || 5))
      if (!ctx || ctx.students.length === 0) {
        console.error('No existing driveStudent links found for provided driveId/collegeId')
        process.exit(1)
      }
    } else {
      ctx = await createStage7Scenario(companyUser.company.id, collegeUser.college, 5)
    }
    const scenario = { drive: ctx.drive, students: ctx.students }
    const studentIds = scenario.students.map((s) => s.id)
    const createRes = await request({
      method: 'POST',
      path: `/api/applications/${scenario.drive.id}/create`,
      token: tokens.college,
      body: { studentIds }
    })
    const createOut = { label: 'CREATE', status: createRes.status, body: createRes.body }
    const companyView = await request({
      method: 'GET',
      path: `/api/applications/drive/${scenario.drive.id}?page=1&limit=20`,
      token: tokens.company
    })
    const companyOut = { label: 'COMPANY_VIEW', status: companyView.status, body: companyView.body }
    const collegeView = await request({
      method: 'GET',
      path: `/api/applications/college/${scenario.drive.id}/${ctx.college ? ctx.college.id : collegeUser.college.id}?page=1&limit=20`,
      token: tokens.college
    })
    const collegeOut = { label: 'COLLEGE_VIEW', status: collegeView.status, body: collegeView.body }
    const stats = await request({
      method: 'GET',
      path: `/api/applications/stats/${scenario.drive.id}`,
      token: tokens.company
    })
    const statsOut = { label: 'STATS', status: stats.status, body: stats.body }
    const filtered = await request({
      method: 'GET',
      path: `/api/applications/drive/${scenario.drive.id}?status=APPLIED&search=S7&page=1&limit=20`,
      token: tokens.company
    })
    const filteredOut = { label: 'FILTERED', status: filtered.status, body: filtered.body }
    const createdCount = createRes.body?.data?.created || 0
    const initialOk = createdCount === 5
    const companyOk = companyView.status === 200
    const collegeOk = collegeView.status === 200
    const statsOk = stats.status === 200
    const filteredOk = filtered.status === 200
    const apps = await prisma.application.findMany({ where: { driveId: scenario.drive.id } })
    const statusOk = apps.every((a) => a.status === 'APPLIED')
    const stageOk = apps.every((a) => a.currentStage === 'APPLICATIONS')
    const results = { createdCount, initialOk, companyOk, collegeOk, statsOk, filteredOk, statusOk, stageOk }
    const out = { driveId: scenario.drive.id, collegeId: (ctx.college ? ctx.college.id : collegeUser.college.id), studentIds, outputs: [createOut, companyOut, collegeOut, statsOut, filteredOut], results }
    fs.writeFileSync(path.join(__dirname, 'stage7_out.json'), JSON.stringify(out, null, 2))
  } catch (error) {
    console.error('Stage7 run error:', error && error.stack ? error.stack : (error.message || String(error)))
    process.exitCode = 1
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await prisma.$disconnect()
  }
}

run()
