require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const file = await prisma.fileUpload.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, driveId: true, collegeId: true }
  })
  if (!file) {
    console.log(JSON.stringify({}))
  } else {
    console.log(JSON.stringify(file))
  }
}
main().catch(async (e) => {
  console.error(e.message)
  await prisma.$disconnect()
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
