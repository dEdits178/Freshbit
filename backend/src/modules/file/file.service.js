const path = require('path')
const fs = require('fs')
const prisma = require('../../../prisma/client')
const AppError = require('../../utils/AppError')
const { parse } = require('csv-parse/sync')
const xlsx = require('xlsx')

class FileService {
  async uploadFileCollege(collegeUserId, driveId, file, fileType) {
    const college = await prisma.college.findUnique({ where: { userId: collegeUserId } })
    if (!college) throw new AppError('College profile not found', 404)

    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId: college.id } }
    })
    if (!driveCollege) throw new AppError('Drive not found or not assigned to your college', 404)
    if (driveCollege.invitationStatus !== 'ACCEPTED') throw new AppError('Drive invitation not accepted', 403)

    const created = await prisma.fileUpload.create({
      data: {
        uploaderRole: 'COLLEGE',
        driveId,
        collegeId: college.id,
        fileType,
        fileUrl: file.path,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedByUserId: collegeUserId
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        createdAt: true
      }
    })
    return {
      id: created.id,
      fileName: created.fileName,
      mimeType: created.mimeType,
      fileSize: created.fileSize,
      uploadedAt: created.createdAt
    }
  }

  async listFilesForCollege(collegeUserId, driveId) {
    const college = await prisma.college.findUnique({ where: { userId: collegeUserId } })
    if (!college) throw new AppError('College profile not found', 404)

    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId, collegeId: college.id } }
    })
    if (!driveCollege) throw new AppError('Drive not found or not assigned to your college', 404)

    return prisma.fileUpload.findMany({
      where: { driveId, collegeId: college.id },
      select: {
        id: true,
        fileType: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getFileWithAccess(user, fileId) {
    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId },
      include: {
        drive: {
          include: { company: { select: { userId: true } } }
        },
        college: true
      }
    })
    if (!file) throw new AppError('File not found', 404)

    if (user.role === 'ADMIN') {
      return file
    }
    if (user.role === 'COLLEGE') {
      if (!file.college || file.college.userId !== user.id) {
        throw new AppError('You do not have permission to access this file', 403)
      }
      return file
    }
    if (user.role === 'COMPANY') {
      if (!file.drive || file.drive.company.userId !== user.id) {
        throw new AppError('You do not have permission to access this file', 403)
      }
      return file
    }
    throw new AppError('You do not have permission to access this file', 403)
  }

  async convertFileCollege(collegeUserId, fileId) {
    const file = await prisma.fileUpload.findUnique({ where: { id: fileId } })
    if (!file) throw new AppError('File not found', 404)
    if (file.uploadedByUserId !== collegeUserId) {
      throw new AppError('You can only convert files you uploaded', 403)
    }
    return this.convertFileByType(file)
  }

  async convertFileAdmin(fileId) {
    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId }
    })
    if (!file) throw new AppError('File not found', 404)
    if (!file.driveId || !file.collegeId) throw new AppError('File metadata incomplete', 400)
    const driveCollege = await prisma.driveCollege.findUnique({
      where: { driveId_collegeId: { driveId: file.driveId, collegeId: file.collegeId } }
    })
    if (!driveCollege || driveCollege.managedBy !== 'ADMIN') {
      throw new AppError('Admin conversion not permitted for this file', 403)
    }
    return this.convertFileByType(file)
  }

  async convertFileByType(file) {
    const mime = file.mimeType
    const filePath = file.fileUrl
    if (mime === 'text/csv') {
      const content = fs.readFileSync(filePath, 'utf-8')
      const records = parse(content, { columns: true, skip_empty_lines: true })
      return this.toPreview(records)
    }
    if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mime === 'application/vnd.ms-excel') {
      const wb = xlsx.readFile(filePath)
      const sheetName = wb.SheetNames[0]
      const sheet = wb.Sheets[sheetName]
      const json = xlsx.utils.sheet_to_json(sheet, { defval: '' })
      return this.toPreview(json)
    }
    throw new AppError('Conversion not supported for this file type yet', 400)
  }

  toPreview(rows) {
    const columnsSet = new Set()
    const normalizedRows = rows.map((row) => {
      const obj = {}
      for (const [key, val] of Object.entries(row)) {
        const norm = String(key).toLowerCase().trim()
        columnsSet.add(norm)
        obj[norm] = val
      }
      return obj
    })
    const columns = Array.from(columnsSet)
    return {
      columns,
      rows: normalizedRows,
      totalRows: normalizedRows.length
    }
  }
}

module.exports = new FileService()
