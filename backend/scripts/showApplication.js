const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const applicationId = process.argv[2]
    if (!applicationId) {
      console.error('Usage: node scripts/showApplication.js <applicationId>')
      process.exit(1)
    }
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
        currentStage: true,
        stageHistory: true,
        selectedAt: true,
        rejectedAt: true
      }
    })
    if (!app) {
      console.error('Application not found:', applicationId)
      process.exit(1)
    }
    console.log(JSON.stringify(app, null, 2))
  } catch (err) {
    console.error(err.message || String(err))
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
