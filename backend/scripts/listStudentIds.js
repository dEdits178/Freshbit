const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const collegeUserId = process.argv[2]
    if (!collegeUserId) {
      console.error('Usage: node scripts/listStudentIds.js <collegeUserId>')
      process.exit(1)
    }
    const college = await prisma.college.findUnique({ where: { userId: collegeUserId } })
    if (!college) {
      console.error('College not found for userId:', collegeUserId)
      process.exit(1)
    }
    const students = await prisma.student.findMany({
      where: { collegeId: college.id },
      select: { id: true, email: true }
    })
    console.log(JSON.stringify({
      collegeId: college.id,
      count: students.length,
      studentIds: students.map(s => s.id),
      students
    }, null, 2))
  } catch (err) {
    console.error(err.message || String(err))
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
