const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const driveId = process.argv[2]
    if (!driveId) {
      console.error('Usage: node scripts/checkDriveStudents.js <driveId>')
      process.exit(1)
    }
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { id: true, companyId: true, status: true, currentStage: true, isLocked: true }
    })
    if (!drive) {
      console.error('Drive not found:', driveId)
      process.exit(1)
    }
    const dcs = await prisma.driveCollege.findMany({
      where: { driveId },
      select: {
        collegeId: true,
        invitationStatus: true,
        managedBy: true,
        startedAt: true
      }
    })
    const colleges = dcs.map(dc => dc.collegeId)
    const students = await prisma.student.findMany({
      where: { collegeId: { in: colleges } },
      select: { id: true, email: true, collegeId: true }
    })
    const dsLinks = await prisma.driveStudent.findMany({
      where: { driveId },
      select: { studentId: true, collegeId: true }
    })
    const byCollege = {}
    for (const dc of dcs) {
      const cId = dc.collegeId
      byCollege[cId] = {
        invitationStatus: dc.invitationStatus,
        managedBy: dc.managedBy,
        startedAt: dc.startedAt,
        studentCount: students.filter(s => s.collegeId === cId).length,
        driveStudentLinks: dsLinks.filter(l => l.collegeId === cId).length
      }
    }
    console.log(JSON.stringify({
      drive,
      colleges: byCollege,
      totalStudents: students.length,
      totalDriveStudentLinks: dsLinks.length
    }, null, 2))
  } catch (err) {
    console.error(err.message || String(err))
    process.exit(1)
  }
}

main()
