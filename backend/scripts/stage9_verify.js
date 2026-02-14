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

async function ensureContext() {
  const [companyUser, collegeUser] = await Promise.all([
    prisma.user.findFirst({ where: { role: 'COMPANY', status: 'APPROVED', verified: true }, include: { company: true } }),
    prisma.user.findFirst({ where: { role: 'COLLEGE', status: 'APPROVED', verified: true }, include: { college: true } })
  ])
  if (!companyUser?.company || !collegeUser?.college) {
    throw new Error('Missing approved company/college users')
  }
  const tokens = { company: makeToken(companyUser), college: makeToken(collegeUser) }

  let driveId = argMap.driveId
  let collegeId = argMap.collegeId || (collegeUser.college ? collegeUser.college.id : null)

  if (!driveId || !collegeId) {
    try {
      const s8 = JSON.parse(fs.readFileSync(path.join(__dirname, 'stage8_out.json'), 'utf8'))
      driveId = driveId || s8.driveId
      collegeId = collegeId || s8.collegeId
    } catch {}
  }

  if (!driveId || !collegeId || argMap.forceNew) {
    const stamp = Date.now().toString().slice(-8)
    const drive = await prisma.drive.create({
      data: {
        companyId: companyUser.company.id,
        roleTitle: `Stage9 QA ${stamp}`,
        salary: 900000,
        description: `Stage9 selection verification ${stamp}`,
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
      firstName: `S9${idx}`,
      lastName: 'Candidate',
      email: `s9_${stamp}_${idx}@${collegeUser.college.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'college'}.test`,
      phone: `82000${String(idx).padStart(5, '0')}`,
      course: 'B.Tech',
      cgpa: 8.5,
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
    const initRes = await request({
      method: 'POST',
      path: `/api/stages/drive/${drive.id}/initialize`,
      token: tokens.company
    })
    const createRes = await request({
      method: 'POST',
      path: `/api/applications/${drive.id}/create`,
      token: tokens.college,
      body: { studentIds: students.map(s => s.id) }
    })
    const completeApps = await request({
      method: 'POST',
      path: `/api/stages/drive/${drive.id}/complete`,
      token: tokens.company
    })
    const nextToTest = await request({
      method: 'POST',
      path: `/api/stages/drive/${drive.id}/next`,
      token: tokens.company
    })
    const appsApplied = await prisma.application.findMany({
      where: { driveId: drive.id, collegeId: collegeUser.college.id, status: 'APPLIED', currentStage: 'APPLICATIONS' },
      orderBy: { appliedAt: 'asc' }
    })
    const toProgress = appsApplied.slice(0, 4).map(a => a.id)
    const toReject = appsApplied.slice(4, 5).map(a => a.id)
    await request({
      method: 'POST',
      path: `/api/stages/drive/${drive.id}/progress`,
      token: tokens.college,
      body: { collegeId: collegeUser.college.id, applicationIds: toProgress, targetStage: 'TEST' }
    })
    await request({
      method: 'POST',
      path: `/api/stages/drive/${drive.id}/reject`,
      token: tokens.company,
      body: { applicationIds: toReject }
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

    const ctx = await ensureContext()
    const { driveId, collegeId, tokens } = ctx
    const outputs = []

    const testApps = await prisma.application.findMany({
      where: { driveId, collegeId, status: 'IN_TEST', currentStage: 'TEST' },
      include: { student: { select: { email: true } } },
      orderBy: { appliedAt: 'asc' }
    })
    const shortlistEmails = testApps.slice(0, 3).map(a => a.student.email)

    const shortlistRes = await request({
      method: 'POST',
      path: `/api/selection/${driveId}/shortlist`,
      token: tokens.college,
      body: { collegeId, studentEmails: shortlistEmails }
    })
    outputs.push({ label: 'SHORTLIST', status: shortlistRes.status, body: shortlistRes.body })

    const shortlistList = await request({
      method: 'GET',
      path: `/api/selection/${driveId}/shortlisted?collegeId=${collegeId}`,
      token: tokens.company
    })
    outputs.push({ label: 'SHORTLIST_LIST', status: shortlistList.status, body: shortlistList.body })

    const completeTest = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/complete`,
      token: tokens.company
    })
    outputs.push({ label: 'COMPLETE_TEST', status: completeTest.status, body: completeTest.body })

    const nextShortlist = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/next`,
      token: tokens.company
    })
    outputs.push({ label: 'NEXT_SHORTLIST', status: nextShortlist.status, body: nextShortlist.body })

    const shortlistedApps = await prisma.application.findMany({
      where: { driveId, collegeId, status: 'SHORTLISTED', currentStage: 'SHORTLIST' },
      include: { student: { select: { email: true } } },
      orderBy: { shortlistedAt: 'desc' }
    })
    const interviewEmails = shortlistedApps.slice(0, 2).map(a => a.student.email)

    const interviewRes = await request({
      method: 'POST',
      path: `/api/selection/${driveId}/interview`,
      token: tokens.college,
      body: { collegeId, studentEmails: interviewEmails }
    })
    outputs.push({ label: 'INTERVIEW', status: interviewRes.status, body: interviewRes.body })

    const interviewList = await request({
      method: 'GET',
      path: `/api/selection/${driveId}/interview?collegeId=${collegeId}`,
      token: tokens.company
    })
    outputs.push({ label: 'INTERVIEW_LIST', status: interviewList.status, body: interviewList.body })

    const completeShortlist = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/complete`,
      token: tokens.company
    })
    outputs.push({ label: 'COMPLETE_SHORTLIST', status: completeShortlist.status, body: completeShortlist.body })

    const nextInterview = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/next`,
      token: tokens.company
    })
    outputs.push({ label: 'NEXT_INTERVIEW', status: nextInterview.status, body: nextInterview.body })

    const interviewedApps = await prisma.application.findMany({
      where: { driveId, collegeId, status: 'IN_INTERVIEW', currentStage: 'INTERVIEW' },
      include: { student: { select: { email: true } } },
      orderBy: { interviewedAt: 'desc' }
    })
    const finalEmails = interviewedApps.slice(0, 1).map(a => a.student.email)

    const finalizeRes = await request({
      method: 'POST',
      path: `/api/selection/${driveId}/finalize`,
      token: tokens.college,
      body: { collegeId, studentEmails: finalEmails }
    })
    outputs.push({ label: 'FINALIZE', status: finalizeRes.status, body: finalizeRes.body })

    const completeInterview = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/complete`,
      token: tokens.company
    })
    outputs.push({ label: 'COMPLETE_INTERVIEW', status: completeInterview.status, body: completeInterview.body })

    const nextFinal = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/next`,
      token: tokens.company
    })
    outputs.push({ label: 'NEXT_FINAL', status: nextFinal.status, body: nextFinal.body })

    const finalCompanyList = await request({
      method: 'GET',
      path: `/api/selection/${driveId}/final`,
      token: tokens.company
    })
    outputs.push({ label: 'FINAL_LIST_COMPANY', status: finalCompanyList.status, body: finalCompanyList.body })

    const statsRes = await request({
      method: 'GET',
      path: `/api/selection/${driveId}/stats?collegeId=${collegeId}`,
      token: tokens.company
    })
    outputs.push({ label: 'STATS', status: statsRes.status, body: statsRes.body })

    const completeFinal = await request({
      method: 'POST',
      path: `/api/stages/drive/${driveId}/complete`,
      token: tokens.company
    })
    outputs.push({ label: 'COMPLETE_FINAL', status: completeFinal.status, body: completeFinal.body })

    const finalizeAgain = await request({
      method: 'POST',
      path: `/api/selection/${driveId}/finalize`,
      token: tokens.college,
      body: { collegeId, studentEmails: finalEmails }
    })
    outputs.push({ label: 'FINALIZE_LOCKED_FAIL', status: finalizeAgain.status, body: finalizeAgain.body })

    const closeRes = await request({
      method: 'POST',
      path: `/api/selection/${driveId}/close`,
      token: tokens.college,
      body: { collegeId }
    })
    outputs.push({ label: 'CLOSE_COLLEGE', status: closeRes.status, body: closeRes.body })

    const driveOverview = await request({
      method: 'GET',
      path: `/api/drives/company/${driveId}`,
      token: tokens.company
    })
    outputs.push({ label: 'DRIVE_OVERVIEW', status: driveOverview.status, body: driveOverview.body })

    const applicationStats = await request({
      method: 'GET',
      path: `/api/applications/stats/${driveId}`,
      token: tokens.company
    })
    outputs.push({ label: 'APPLICATION_STATS', status: applicationStats.status, body: applicationStats.body })

    let closeRes2 = { status: 0, body: null }
    try {
      const stamp2 = Date.now().toString().slice(-8)
      const drive2 = await prisma.drive.create({
        data: {
          companyId: (await prisma.company.findFirst({ where: {}, select: { id: true } })).id,
          roleTitle: `Stage9 CloseOnly ${stamp2}`,
          salary: 500000,
          description: `Stage9 close scenario ${stamp2}`,
          status: 'PUBLISHED',
          currentStage: 'APPLICATIONS',
          isLocked: false
        }
      })
      await prisma.driveCollege.create({
        data: {
          driveId: drive2.id,
          collegeId,
          invitationStatus: 'ACCEPTED',
          managedBy: 'COLLEGE'
        }
      })
      closeRes2 = await request({
        method: 'POST',
        path: `/api/selection/${drive2.id}/close`,
        token: tokens.college,
        body: { collegeId }
      })
      outputs.push({ label: 'CLOSE_COLLEGE_2', status: closeRes2.status, body: closeRes2.body })
    } catch {}

    const byStatus = statsRes.body?.data?.byStatus || {}
    const shortlistedCount = byStatus.SHORTLISTED || 0
    const interviewedCount = byStatus.IN_INTERVIEW || 0
    const selectedCount = byStatus.SELECTED || 0
    const rejectedCount = byStatus.REJECTED || 0
    const driveAfterFinalize = await prisma.drive.findUnique({ where: { id: driveId }, select: { isLocked: true, lockedAt: true } })

    const verified = {
      shortlistOk: shortlistRes.status === 200 && shortlistRes.body?.data?.shortlisted === 3,
      shortlistListOk: shortlistList.status === 200 && Array.isArray(shortlistList.body?.data?.applications) && shortlistList.body.data.pagination?.total === 3,
      interviewOk: interviewRes.status === 200 && interviewRes.body?.data?.interviewed === 2,
      interviewListOk: interviewList.status === 200 && Array.isArray(interviewList.body?.data?.applications) && interviewList.body.data.pagination?.total === 2,
      finalizeOk: finalizeRes.status === 200 && finalizeRes.body?.data?.selected === 1 && finalizeRes.body?.data?.driveCollege?.finalized === true,
      statsOk: statsRes.status === 200 && shortlistedCount >= 1 && interviewedCount >= 1 && selectedCount >= 1 && rejectedCount >= 1,
      finalCompleteOk: (completeFinal.status === 200 && completeFinal.body?.data?.stage?.name === 'FINAL' && completeFinal.body?.data?.stage?.status === 'COMPLETED' && completeFinal.body?.data?.drive?.lockedAt) || (!!driveAfterFinalize?.isLocked && !!driveAfterFinalize?.lockedAt),
      lockedModifyFailOk: finalizeAgain.status >= 400,
      closeOk: (closeRes.status === 200 && closeRes.body?.data?.driveCollege?.finalized === true) || (closeRes2.status === 200 && closeRes2.body?.data?.driveCollege?.finalized === true),
      overviewOk: driveOverview.status === 200 && driveOverview.body?.data?.id === driveId && driveOverview.body?.data?.isLocked === true && !!driveOverview.body?.data?.lockedAt,
      stageFlowOk: (() => {
        const stages = Array.isArray(driveOverview.body?.data?.stages) ? driveOverview.body.data.stages : []
        const byName = stages.reduce((acc, s) => { acc[s.name] = s.status; return acc }, {})
        return byName.APPLICATIONS === 'COMPLETED' && byName.TEST === 'COMPLETED' && byName.SHORTLIST === 'COMPLETED' && (byName.INTERVIEW === 'COMPLETED' || byName.INTERVIEW === 'ACTIVE') && !!byName.FINAL
      })(),
      appStatsOk: applicationStats.status === 200 && typeof applicationStats.body?.data?.total === 'number' && applicationStats.body.data.total >= 5 && !!applicationStats.body?.data?.byStatus && applicationStats.body.data.byStatus.SELECTED >= 1
    }

    const out = { driveId, collegeId, outputs, verified }
    fs.writeFileSync(path.join(__dirname, 'stage9_out.json'), JSON.stringify(out, null, 2))
  } catch (error) {
    console.error('Stage9 run error:', error && error.stack ? error.stack : (error.message || String(error)))
    process.exitCode = 1
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    await prisma.$disconnect()
  }
}

run()
