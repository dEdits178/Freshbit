require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const drive = await prisma.drive.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true }
  })
  if (!drive) {
    console.log('')
  } else {
    console.log(drive.id)
  }
}
main().catch(async (e) => {
  console.error(e.message)
  await prisma.$disconnect()
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
