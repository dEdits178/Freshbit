const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_REJECT_STAGES = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL']

class SelectionService {
  async getCollegeIdFromUser(currentUser) {
    const college = await prisma.college.findUnique({
      where: { userId: currentUser.id },
      select: { id: true }
    })

    if (!college) {
      throw new AppError('College profile not found', 404)
    }

    return college.id
  }

  normalizeEmails(emails = [], { fieldName = 'studentEmails', rejectDuplicates = false } = {}) {
    if (!Array.isArray(emails)) {
      throw new AppError('emails must be an array', 400)
    }

    const normalized = emails
      .map((email) => String(email || '').trim().toLowerCase())
      .filter(Boolean)

    if (normalized.length === 0) {
      throw new AppError(`${fieldName} must contain at least one valid email`, 400)
    }

    const invalid = normalized.filter((email) => !EMAIL_REGEX.test(email))
    if (invalid.length > 0) {
      throw new AppError(`Invalid email format: ${invalid.slice(0, 3).join(', ')}`, 400)
    }

    const seen = new Set()
    const duplicates = []
    normalized.forEach((email) => {
      if (seen.has(email)) {
        duplicates.push(email)
      } else {
        seen.add(email)
      }
    })

    if (rejectDuplicates && duplicates.length > 0) {
      throw new AppError(`Duplicate emails are not allowed: ${[...new Set(duplicates)].slice(0, 5).join(', ')}`, 400)
    }

    return [...new Set(normalized)]
  }

  parsePagination(pagination = {}) {
    const page = Math.max(parseInt(pagination.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(pagination.limit, 10) || 20, 1), 100)
    return { page, limit, skip: (page - 1) * limit }
  }

  appendStageHistory(existingHistory, payload) {
    const history = Array.isArray(existingHistory) ? existingHistory : []
    return [
      ...history,
      {
        ...payload,
        timestamp: new Date().toISOString()
      }
    ]
  }

  async getDriveOrThrow(driveId) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: {
        id: true,
        companyId: true,
        currentStage: true,
        isLocked: true,
        status: true
      }
    })

    if (!drive) {
      throw new AppError('Drive not found', 404)
    }

    return drive
  }

  async getDriveCollegeOrThrow(driveId, collegeId) {
    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId } },
      include: {
        college: {
          select: {
            id: true,
            userId: true,
            name: true
          }
        }
      }
    })

    if (!driveCollege) {
      throw new AppError('Drive-college mapping not found', 404)
    }

    if (driveCollege.invitationStatus !== 'ACCEPTED') {
      throw new AppError('Drive not accepted by this college', 403)
    }

    return driveCollege
  }

  async assertDriveCompanyAccess(drive, currentUser) {
    if (currentUser.role !== 'COMPANY') return

    const company = await prisma.company.findUnique({
      where: { userId: currentUser.id },
      select: { id: true }
    })

    if (!company || company.id !== drive.companyId) {
      throw new AppError('Unauthorized access', 403)
    }
  }

  async assertCollegeIdentity(collegeId, currentUser) {
    if (currentUser.role !== 'COLLEGE') return

    const college = await prisma.college.findUnique({
      where: { userId: currentUser.id },
      select: { id: true }
    })

    if (!college) {
      throw new AppError('College profile not found', 404)
    }

    if (college.id !== collegeId) {
      throw new AppError('College can only access its own records', 403)
    }
  }

  assertManagedByForCollegeFlow(driveCollege, currentUser, { allowAdminOverride = true } = {}) {
    if (!driveCollege.managedBy) {
      throw new AppError('Drive management is not configured', 400)
    }

    if (driveCollege.managedBy === 'ADMIN') {
      if (currentUser.role !== 'ADMIN') {
        throw new AppError('Only admin can modify this admin-managed drive', 403)
      }
      return
    }

    if (driveCollege.managedBy === 'COLLEGE') {
      if (currentUser.role === 'ADMIN' && allowAdminOverride) return
      if (currentUser.role !== 'COLLEGE' || currentUser.id !== driveCollege.college.userId) {
        throw new AppError('Only owning college can perform this action', 403)
      }
      return
    }

    throw new AppError('Invalid managedBy configuration', 400)
  }

  async assertFinalizePermission({ drive, driveCollege, currentUser }) {
    if (currentUser.role === 'ADMIN') return

    if (currentUser.role === 'COMPANY') {
      await this.assertDriveCompanyAccess(drive, currentUser)
      return
    }

    if (currentUser.role === 'COLLEGE') {
      this.assertManagedByForCollegeFlow(driveCollege, currentUser, { allowAdminOverride: false })
      return
    }

    throw new AppError('Unauthorized access', 403)
  }

  async assertReadAccess({ drive, collegeId, currentUser }) {
    if (currentUser.role === 'ADMIN') return

    if (currentUser.role === 'COMPANY') {
      await this.assertDriveCompanyAccess(drive, currentUser)
      return
    }

    if (currentUser.role === 'COLLEGE') {
      await this.assertCollegeIdentity(collegeId, currentUser)
      return
    }

    throw new AppError('Unauthorized access', 403)
  }

  async assertStageIsActive(driveId, stageName) {
    const stage = await prisma.stage.findUnique({
      where: { driveId_name: { driveId, name: stageName } },
      select: { status: true }
    })

    if (!stage || stage.status !== 'ACTIVE') {
      throw new AppError(`${stageName} stage is not active`, 400)
    }
  }

  async getStudentMapByEmails(collegeId, emails) {
    const students = await prisma.student.findMany({
      where: {
        collegeId,
        email: { in: emails }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cgpa: true,
        course: true
      }
    })

    return students.reduce((acc, student) => {
      acc[student.email.toLowerCase()] = student
      return acc
    }, {})
  }

  async validateEmailsAgainstStudents({ driveId, collegeId, emails, currentUser }) {
    const drive = await this.getDriveOrThrow(driveId)
    if (drive.isLocked) throw new AppError('Drive locked. Cannot validate selection emails', 400)

    let targetCollegeId = collegeId
    if (currentUser && currentUser.role === 'COLLEGE') {
      targetCollegeId = await this.getCollegeIdFromUser(currentUser)
    }

    if (!targetCollegeId) {
      throw new AppError('collegeId is required', 400)
    }

    const driveCollege = await this.getDriveCollegeOrThrow(driveId, targetCollegeId)
    if (currentUser) {
      this.assertManagedByForCollegeFlow(driveCollege, currentUser)
    }

    const normalizedEmails = this.normalizeEmails(emails, { fieldName: 'emails' })

    const [studentMap, driveStudentLinks] = await Promise.all([
      this.getStudentMapByEmails(targetCollegeId, normalizedEmails),
      prisma.driveStudent.findMany({
        where: {
          driveId,
          collegeId: targetCollegeId
        },
        include: {
          student: {
            select: { id: true, email: true }
          }
        }
      })
    ])

    const linkedStudentEmails = new Set(
      driveStudentLinks
        .map((item) => (item.student && item.student.email ? item.student.email.toLowerCase() : null))
        .filter(Boolean)
    )

    const valid = []
    const invalid = []

    normalizedEmails.forEach((email) => {
      const student = studentMap[email]
      if (!student) {
        invalid.push({ email, reason: 'NOT_FOUND_IN_COLLEGE' })
        return
      }

      if (!linkedStudentEmails.has(email)) {
        invalid.push({ email, reason: 'NOT_LINKED_TO_DRIVE' })
        return
      }

      valid.push(email)
    })

    return { valid, invalid }
  }

  async resolveEligibleApplications({ driveId, collegeId, emails, requiredStage, rejectDuplicates = true }) {
    const normalizedEmails = this.normalizeEmails(emails, { fieldName: 'studentEmails', rejectDuplicates })
    const studentMap = await this.getStudentMapByEmails(collegeId, normalizedEmails)

    const studentIds = Object.values(studentMap).map((student) => student.id)
    const driveLinks = await prisma.driveStudent.findMany({
      where: { driveId, collegeId, studentId: { in: studentIds } },
      select: { studentId: true }
    })
    const linkedStudentIds = new Set(driveLinks.map((row) => row.studentId))

    const linkedStudents = Object.values(studentMap).filter((student) => linkedStudentIds.has(student.id))
    const linkedStudentIdToEmail = linkedStudents.reduce((acc, student) => {
      acc[student.id] = student.email.toLowerCase()
      return acc
    }, {})

    const applications = await prisma.application.findMany({
      where: {
        driveId,
        collegeId,
        studentId: { in: linkedStudents.map((student) => student.id) },
        currentStage: requiredStage,
        status: { not: 'REJECTED' }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            cgpa: true,
            course: true
          }
        }
      }
    })

    const appByEmail = applications.reduce((acc, app) => {
      acc[linkedStudentIdToEmail[app.studentId]] = app
      return acc
    }, {})

    const selectedApplications = []
    const notFound = []

    normalizedEmails.forEach((email) => {
      const app = appByEmail[email]
      if (!app) {
        notFound.push(email)
        return
      }
      selectedApplications.push(app)
    })

    return {
      selectedApplications,
      notFound,
      normalizedEmails,
      previewStudents: selectedApplications.map((app) => ({
        applicationId: app.id,
        studentId: app.student.id,
        name: `${app.student.firstName} ${app.student.lastName}`,
        email: app.student.email,
        cgpa: app.student.cgpa,
        course: app.student.course
      }))
    }
  }

  assertNoMissingApplications(notFound, stageName) {
    if (!notFound || notFound.length === 0) return
    throw new AppError(
      `Some emails are invalid for ${stageName} transition: ${notFound.slice(0, 5).join(', ')}`,
      400
    )
  }

  async uploadShortlist({ driveId, collegeId, studentEmails, currentUser, preview = false }) {
    const drive = await this.getDriveOrThrow(driveId)
    if (drive.isLocked) throw new AppError('Drive locked. Cannot modify selections', 400)
    if (drive.currentStage !== 'TEST') throw new AppError('Shortlist upload allowed only during TEST stage', 400)
    await this.assertStageIsActive(driveId, 'TEST')

    const driveCollege = await this.getDriveCollegeOrThrow(driveId, collegeId)
    this.assertManagedByForCollegeFlow(driveCollege, currentUser)

    if (driveCollege.finalized) {
      throw new AppError('College flow already closed for this drive', 409)
    }

    if (driveCollege.shortlistSubmitted && currentUser.role !== 'ADMIN') {
      throw new AppError('Shortlist already submitted for this college', 409)
    }

    const { selectedApplications, notFound, previewStudents } = await this.resolveEligibleApplications({
      driveId,
      collegeId,
      emails: studentEmails,
      requiredStage: 'TEST'
    })

    if (preview) {
      return {
        preview: true,
        shortlisted: selectedApplications.length,
        notFound,
        students: previewStudents,
        collegeId,
        driveId
      }
    }

    this.assertNoMissingApplications(notFound, 'shortlist')

    if (selectedApplications.length === 0) {
      throw new AppError('No applications in TEST stage to shortlist', 400)
    }

    const now = new Date()
    const shortlistedIds = selectedApplications.map((app) => app.id)

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        selectedApplications.map((app) =>
          tx.application.update({
            where: { id: app.id },
            data: {
              status: 'SHORTLISTED',
              currentStage: 'SHORTLIST',
              shortlistedAt: now,
              shortlistedBy: currentUser.id,
              stageHistory: this.appendStageHistory(app.stageHistory, {
                action: 'STAGE_TRANSITION',
                fromStage: 'TEST',
                toStage: 'SHORTLIST',
                status: 'SHORTLISTED',
                by: currentUser.id
              })
            }
          })
        )
      )

      await tx.driveCollege.update({
        where: { driveId_collegeId: { driveId, collegeId } },
        data: {
          shortlistSubmitted: true,
          shortlistSubmittedAt: now,
          shortlistedCount: shortlistedIds.length
        }
      })
    })

    return {
      shortlisted: shortlistedIds.length,
      notFound,
      collegeId,
      driveId
    }
  }

  async uploadInterviewList({ driveId, collegeId, studentEmails, currentUser, preview = false }) {
    const drive = await this.getDriveOrThrow(driveId)
    if (drive.isLocked) throw new AppError('Drive locked. Cannot modify selections', 400)
    if (drive.currentStage !== 'SHORTLIST') throw new AppError('Interview list upload allowed only during SHORTLIST stage', 400)
    await this.assertStageIsActive(driveId, 'SHORTLIST')

    const driveCollege = await this.getDriveCollegeOrThrow(driveId, collegeId)
    this.assertManagedByForCollegeFlow(driveCollege, currentUser)

    if (driveCollege.finalized) {
      throw new AppError('College flow already closed for this drive', 409)
    }

    if (driveCollege.interviewListSubmitted && currentUser.role !== 'ADMIN') {
      throw new AppError('Interview list already submitted for this college', 409)
    }

    const { selectedApplications, notFound, previewStudents } = await this.resolveEligibleApplications({
      driveId,
      collegeId,
      emails: studentEmails,
      requiredStage: 'SHORTLIST'
    })

    if (preview) {
      return {
        preview: true,
        interviewed: selectedApplications.length,
        notFound,
        students: previewStudents,
        collegeId,
        driveId
      }
    }

    this.assertNoMissingApplications(notFound, 'interview')

    if (selectedApplications.length === 0) {
      throw new AppError('No applications in SHORTLIST stage to move into interview', 400)
    }

    const now = new Date()

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        selectedApplications.map((app) =>
          tx.application.update({
            where: { id: app.id },
            data: {
              status: 'IN_INTERVIEW',
              currentStage: 'INTERVIEW',
              interviewedAt: now,
              interviewedBy: currentUser.id,
              stageHistory: this.appendStageHistory(app.stageHistory, {
                action: 'STAGE_TRANSITION',
                fromStage: 'SHORTLIST',
                toStage: 'INTERVIEW',
                status: 'IN_INTERVIEW',
                by: currentUser.id
              })
            }
          })
        )
      )

      await tx.driveCollege.update({
        where: { driveId_collegeId: { driveId, collegeId } },
        data: {
          interviewListSubmitted: true,
          interviewListSubmittedAt: now,
          interviewedCount: selectedApplications.length
        }
      })
    })

    return {
      interviewed: selectedApplications.length,
      notFound,
      collegeId,
      driveId
    }
  }

  async finalizeSelections({ driveId, collegeId, studentEmails, currentUser, preview = false }) {
    const drive = await this.getDriveOrThrow(driveId)
    if (drive.isLocked) throw new AppError('Drive locked. Cannot modify selections', 400)
    if (drive.currentStage !== 'INTERVIEW') {
      throw new AppError('Finalization allowed only during INTERVIEW stage', 400)
    }
    await this.assertStageIsActive(driveId, 'INTERVIEW')

    const driveCollege = await this.getDriveCollegeOrThrow(driveId, collegeId)
    if (driveCollege.finalized) {
      throw new AppError('Selections already finalized for this college', 409)
    }
    await this.assertFinalizePermission({ drive, driveCollege, currentUser })

    const { selectedApplications, notFound, previewStudents } = await this.resolveEligibleApplications({
      driveId,
      collegeId,
      emails: studentEmails,
      requiredStage: 'INTERVIEW'
    })

    if (preview) {
      return {
        preview: true,
        selected: selectedApplications.length,
        notFound,
        students: previewStudents,
        collegeId,
        driveId
      }
    }

    this.assertNoMissingApplications(notFound, 'finalization')

    if (selectedApplications.length === 0) {
      throw new AppError('No applications in INTERVIEW stage to finalize', 400)
    }

    const now = new Date()
    const selectedIds = selectedApplications.map((app) => app.id)

    const result = await prisma.$transaction(async (tx) => {
      await Promise.all(
        selectedApplications.map((app) =>
          tx.application.update({
            where: { id: app.id },
            data: {
              status: 'SELECTED',
              currentStage: 'FINAL',
              selectedAt: now,
              selectedBy: currentUser.id,
              stageHistory: this.appendStageHistory(app.stageHistory, {
                action: 'STAGE_TRANSITION',
                fromStage: 'INTERVIEW',
                toStage: 'FINAL',
                status: 'SELECTED',
                by: currentUser.id
              })
            }
          })
        )
      )

      const updatedDriveCollege = await tx.driveCollege.update({
        where: { driveId_collegeId: { driveId, collegeId } },
        data: {
          finalized: true,
          finalizedAt: now,
          finalizedBy: currentUser.id,
          selectedCount: selectedIds.length
        },
        select: {
          driveId: true,
          collegeId: true,
          finalized: true,
          finalizedAt: true,
          finalizedBy: true,
          selectedCount: true
        }
      })

      const pendingAcceptedColleges = await tx.driveCollege.count({
        where: {
          driveId,
          invitationStatus: 'ACCEPTED',
          finalized: false
        }
      })

      if (pendingAcceptedColleges === 0) {
        await tx.drive.update({
          where: { id: driveId },
          data: {
            isLocked: true,
            lockedAt: now,
            status: 'CLOSED'
          }
        })
      }

      return updatedDriveCollege
    })

    return {
      selected: selectedIds.length,
      notFound,
      driveCollege: result
    }
  }

  async bulkRejectApplications({ driveId, collegeId, studentEmails, currentStage, currentUser, preview = false }) {
    if (!['COMPANY', 'ADMIN'].includes(currentUser.role)) {
      throw new AppError('Only company/admin can reject applications', 403)
    }

    if (!ALLOWED_REJECT_STAGES.includes(currentStage)) {
      throw new AppError('Invalid currentStage for rejection', 400)
    }

    const drive = await this.getDriveOrThrow(driveId)
    if (drive.isLocked) throw new AppError('Drive locked. Cannot modify selections', 400)

    await this.assertDriveCompanyAccess(drive, currentUser)
    const driveCollege = await this.getDriveCollegeOrThrow(driveId, collegeId)

    if (driveCollege.finalized) {
      throw new AppError('College flow already closed for this drive', 409)
    }

    const { selectedApplications, notFound, previewStudents } = await this.resolveEligibleApplications({
      driveId,
      collegeId,
      emails: studentEmails,
      requiredStage: currentStage
    })

    if (preview) {
      return {
        preview: true,
        rejected: selectedApplications.length,
        students: previewStudents,
        driveId,
        collegeId,
        currentStage
      }
    }

    this.assertNoMissingApplications(notFound, `${currentStage} rejection`)

    if (selectedApplications.length === 0) {
      throw new AppError(`No applications found in ${currentStage} stage for rejection`, 400)
    }

    const now = new Date()

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        selectedApplications.map((app) =>
          tx.application.update({
            where: { id: app.id },
            data: {
              status: 'REJECTED',
              rejectedAt: now,
              rejectedBy: currentUser.id,
              stageHistory: this.appendStageHistory(app.stageHistory, {
                action: 'REJECTED',
                fromStage: app.currentStage,
                toStage: app.currentStage,
                status: 'REJECTED',
                by: currentUser.id
              })
            }
          })
        )
      )
    })

    return { rejected: selectedApplications.length }
  }

  async getShortlistedApplications({ driveId, collegeId, currentUser, pagination }) {
    const drive = await this.getDriveOrThrow(driveId)
    let targetCollegeId = collegeId
    if (currentUser.role === 'COLLEGE') {
      targetCollegeId = await this.getCollegeIdFromUser(currentUser)
    }

    if (!targetCollegeId) {
      throw new AppError('collegeId is required', 400)
    }

    await this.assertReadAccess({ drive, collegeId: targetCollegeId, currentUser })
    await this.getDriveCollegeOrThrow(driveId, targetCollegeId)

    const { page, limit, skip } = this.parsePagination(pagination)

    const where = {
      driveId,
      collegeId: targetCollegeId,
      status: 'SHORTLISTED'
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              course: true,
              cgpa: true
            }
          }
        },
        orderBy: { shortlistedAt: 'desc' }
      }),
      prisma.application.count({ where })
    ])

    return {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getInterviewApplications({ driveId, collegeId, currentUser, pagination }) {
    const drive = await this.getDriveOrThrow(driveId)
    let targetCollegeId = collegeId
    if (currentUser.role === 'COLLEGE') {
      targetCollegeId = await this.getCollegeIdFromUser(currentUser)
    }

    if (!targetCollegeId) {
      throw new AppError('collegeId is required', 400)
    }

    await this.assertReadAccess({ drive, collegeId: targetCollegeId, currentUser })
    await this.getDriveCollegeOrThrow(driveId, targetCollegeId)

    const { page, limit, skip } = this.parsePagination(pagination)
    const where = {
      driveId,
      collegeId: targetCollegeId,
      status: 'IN_INTERVIEW'
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              course: true,
              cgpa: true
            }
          }
        },
        orderBy: { interviewedAt: 'desc' }
      }),
      prisma.application.count({ where })
    ])

    return {
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getFinalSelections({ driveId, collegeId, currentUser, pagination }) {
    const drive = await this.getDriveOrThrow(driveId)
    let targetCollegeId = collegeId

    if (currentUser.role === 'COLLEGE') {
      targetCollegeId = await this.getCollegeIdFromUser(currentUser)
      await this.assertReadAccess({ drive, collegeId: targetCollegeId, currentUser })
    } else {
      await this.assertReadAccess({ drive, collegeId: targetCollegeId, currentUser })
    }

    const { page, limit, skip } = this.parsePagination(pagination)
    const where = {
      driveId,
      status: 'SELECTED'
    }

    if (targetCollegeId) {
      where.collegeId = targetCollegeId
    }

    const [applications, total, byCollege] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              course: true,
              cgpa: true
            }
          },
          college: {
            select: { id: true, name: true }
          }
        },
        orderBy: { selectedAt: 'desc' }
      }),
      prisma.application.count({ where }),
      prisma.application.groupBy({
        by: ['collegeId'],
        where,
        _count: { _all: true }
      })
    ])

    let groupedApplications = applications
    if (currentUser.role === 'COMPANY' || currentUser.role === 'ADMIN') {
      groupedApplications = applications.reduce((acc, app) => {
        if (!acc[app.collegeId]) {
          acc[app.collegeId] = {
            college: app.college,
            applications: []
          }
        }
        acc[app.collegeId].applications.push(app)
        return acc
      }, {})
    }

    return {
      applications: groupedApplications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        selected: total,
        byCollege: byCollege.reduce((acc, item) => {
          acc[item.collegeId] = item._count._all
          return acc
        }, {})
      }
    }
  }

  async getSelectionStats({ driveId, collegeId, currentUser }) {
    const drive = await this.getDriveOrThrow(driveId)
    let targetCollegeId = collegeId

    if (currentUser.role === 'COLLEGE') {
      targetCollegeId = await this.getCollegeIdFromUser(currentUser)
      await this.assertReadAccess({ drive, collegeId: targetCollegeId, currentUser })
    } else {
      await this.assertReadAccess({ drive, collegeId: targetCollegeId, currentUser })
    }

    const where = { driveId }
    if (targetCollegeId) where.collegeId = targetCollegeId

    const [
      byStatusRaw,
      byCollegeApplications,
      driveColleges,
      totalApplications,
      finalizedColleges,
      acceptedColleges
    ] = await Promise.all([
      prisma.application.groupBy({
        by: ['status'],
        where,
        _count: { _all: true }
      }),
      prisma.application.groupBy({
        by: ['collegeId', 'status'],
        where,
        _count: { _all: true }
      }),
      prisma.driveCollege.findMany({
        where: {
          driveId,
          ...(targetCollegeId ? { collegeId: targetCollegeId } : {})
        },
        include: {
          college: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.application.count({ where }),
      prisma.driveCollege.count({
        where: {
          driveId,
          invitationStatus: 'ACCEPTED',
          finalized: true
        }
      }),
      prisma.driveCollege.count({
        where: {
          driveId,
          invitationStatus: 'ACCEPTED'
        }
      })
    ])

    const byStatus = {
      SHORTLISTED: 0,
      IN_INTERVIEW: 0,
      SELECTED: 0,
      REJECTED: 0
    }

    byStatusRaw.forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(byStatus, row.status)) {
        byStatus[row.status] = row._count._all
      }
    })

    const byCollegeMap = driveColleges.reduce((acc, row) => {
      acc[row.collegeId] = {
        collegeId: row.collegeId,
        collegeName: row.college ? row.college.name : null,
        shortlisted: 0,
        interviewed: 0,
        selected: 0,
        finalized: row.finalized,
        finalizedAt: row.finalizedAt,
        finalizedBy: row.finalizedBy,
        shortlistSubmitted: row.shortlistSubmitted,
        shortlistSubmittedAt: row.shortlistSubmittedAt,
        interviewListSubmitted: row.interviewListSubmitted,
        interviewListSubmittedAt: row.interviewListSubmittedAt
      }
      return acc
    }, {})

    byCollegeApplications.forEach((row) => {
      const target = byCollegeMap[row.collegeId]
      if (!target) return
      if (row.status === 'SHORTLISTED') target.shortlisted = row._count._all
      if (row.status === 'IN_INTERVIEW') target.interviewed = row._count._all
      if (row.status === 'SELECTED') target.selected = row._count._all
    })

    return {
      byStatus,
      byCollege: Object.values(byCollegeMap),
      metadata: {
        totalApplications,
        finalizedColleges,
        pendingColleges: Math.max(acceptedColleges - finalizedColleges, 0)
      }
    }
  }

  async closeCollegeDrive({ driveId, collegeId, currentUser }) {
    const drive = await this.getDriveOrThrow(driveId)
    if (drive.isLocked) throw new AppError('Drive already locked', 400)

    const driveCollege = await this.getDriveCollegeOrThrow(driveId, collegeId)

    if (driveCollege.finalized) {
      throw new AppError('College drive already closed', 409)
    }

    this.assertManagedByForCollegeFlow(driveCollege, currentUser)

    if (currentUser.role === 'COLLEGE') {
      await this.assertCollegeIdentity(collegeId, currentUser)
      if (currentUser.id !== driveCollege.college.userId) {
        throw new AppError('Only owning college can close this drive-college flow', 403)
      }
    } else if (currentUser.role !== 'ADMIN') {
      throw new AppError('Unauthorized access', 403)
    }

    const now = new Date()

    const updatedDriveCollege = await prisma.$transaction(async (tx) => {
      const updated = await tx.driveCollege.update({
        where: { driveId_collegeId: { driveId, collegeId } },
        data: {
          finalized: true,
          finalizedAt: now,
          finalizedBy: currentUser.id
        },
        include: {
          college: {
            select: { id: true, name: true }
          }
        }
      })

      return updated
    })

    return updatedDriveCollege
  }
}

module.exports = new SelectionService()
