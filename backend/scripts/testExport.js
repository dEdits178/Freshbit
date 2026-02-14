require('dotenv').config()
const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fileService = require('../src/modules/file/file.service')
async function main() {
  const collegeUser = await prisma.user.findUnique({ where: { email: 'college@freshbit.com' } })
  if (!collegeUser) {
    throw new Error('College user not found')
  }
  const file = await prisma.fileUpload.findFirst({
    where: { uploadedByUserId: collegeUser.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true }
  })
  if (!file) {
    throw new Error('No file found to export')
  }
  const csv = await fileService.exportFileCollege(collegeUser.id, file.id, 'csv')
  const xlsx = await fileService.exportFileCollege(collegeUser.id, file.id, 'xlsx')
  const outCsv = path.resolve(__dirname, `../exported_students_${Date.now()}.csv`)
  const outXlsx = path.resolve(__dirname, `../exported_students_${Date.now()}.xlsx`)
  fs.writeFileSync(outCsv, csv.content)
  fs.writeFileSync(outXlsx, xlsx.content)
  console.log(JSON.stringify({ fileId: file.id, csvPath: outCsv, xlsxPath: outXlsx }))
}
main().catch(async (e) => {
  console.error(e.message)
  await prisma.$disconnect()
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
