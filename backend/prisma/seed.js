const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.create({
    data: {
      email: 'admin@freshbit.test',
      password: 'hashed-admin-password',
      role: 'ADMIN',
      status: 'APPROVED',
      verified: true
    }
  })

  const companyUser = await prisma.user.create({
    data: {
      email: 'company@freshbit.test',
      password: 'hashed-company-password',
      role: 'COMPANY',
      status: 'APPROVED',
      verified: true
    }
  })

  const company = await prisma.company.create({
    data: {
      name: 'FreshBit Co',
      domain: 'freshbit.example',
      approved: true,
      userId: companyUser.id
    }
  })

  const collegeUser1 = await prisma.user.create({
    data: {
      email: 'college1@freshbit.test',
      password: 'hashed-college1-password',
      role: 'COLLEGE',
      status: 'APPROVED',
      verified: true
    }
  })

  const collegeUser2 = await prisma.user.create({
    data: {
      email: 'college2@freshbit.test',
      password: 'hashed-college2-password',
      role: 'COLLEGE',
      status: 'APPROVED',
      verified: true
    }
  })

  const college1 = await prisma.college.create({
    data: {
      name: 'Alpha College',
      city: 'City A',
      state: 'State A',
      tier: 'Tier 2',
      approved: true,
      userId: collegeUser1.id
    }
  })

  const college2 = await prisma.college.create({
    data: {
      name: 'Beta College',
      city: 'City B',
      state: 'State B',
      tier: 'Tier 1',
      approved: true,
      userId: collegeUser2.id
    }
  })

  const drive = await prisma.drive.create({
    data: {
      companyId: company.id,
      roleTitle: 'Software Engineer',
      salary: 1200000,
      description: 'Hiring for FreshBit campus drive',
      status: 'PUBLISHED',
      jdFileUrl: null
    }
  })

  await prisma.driveCollege.createMany({
    data: [
      { driveId: drive.id, collegeId: college1.id },
      { driveId: drive.id, collegeId: college2.id }
    ],
    skipDuplicates: true
  })

  return { admin, company, college1, college2, drive }
}

main()
  .then((res) => {
    console.log('Seed complete', res)
  })
  .catch(async (e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
