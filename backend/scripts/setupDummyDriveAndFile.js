const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const companyUser = await prisma.user.findUnique({ where: { email: 'company@freshbit.com' } })
  const collegeUser = await prisma.user.findUnique({ where: { email: 'college@freshbit.com' } })
  if (!companyUser || !collegeUser) {
    throw new Error('Seed users not found')
  }
  const company = await prisma.company.findUnique({ where: { userId: companyUser.id } })
  const college = await prisma.college.findUnique({ where: { userId: collegeUser.id } })
  if (!company || !college) {
    throw new Error('Seed profiles not found')
  }
  const drive = await prisma.drive.create({
    data: {
      companyId: company.id,
      roleTitle: 'QA Intern',
      salary: 500000,
      description: 'Dummy drive for upload/export testing',
      status: 'DRAFT',
      currentStage: 'APPLICATIONS'
    }
  })
  await prisma.driveCollege.create({
    data: {
      driveId: drive.id,
      collegeId: college.id,
      invitationStatus: 'ACCEPTED'
    }
  })
  const uploadDir = path.resolve(__dirname, '../src/uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  const csvPath = path.join(uploadDir, `sample_students_${Date.now()}.csv`)
  const csvContent = [
    'firstName,lastName,email,phone,course,cgpa',
    'Alice,Smith,alice@alpha.edu,9999999999,B.Tech,8.2',
    'Bob,Jones,bob@alpha.edu,8888888888,B.Sc,7.5'
  ].join('\n')
  fs.writeFileSync(csvPath, csvContent, 'utf-8')
  const created = await prisma.fileUpload.create({
    data: {
      uploaderRole: 'COLLEGE',
      driveId: drive.id,
      collegeId: college.id,
      fileType: 'STUDENT_LIST',
      fileUrl: csvPath,
      fileName: path.basename(csvPath),
      fileSize: fs.statSync(csvPath).size,
      mimeType: 'text/csv',
      uploadedByUserId: collegeUser.id
    },
    select: { id: true }
  })
  console.log(JSON.stringify({ driveId: drive.id, collegeId: college.id, fileId: created.id }))
}
main().catch(async (e) => {
  console.error(e.message)
  await prisma.$disconnect()
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
