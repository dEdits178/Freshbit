const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@freshbit.test' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      status: 'APPROVED',
      verified: true
    },
    create: {
      email: 'admin@freshbit.test',
      password: adminPassword,
      role: 'ADMIN',
      status: 'APPROVED',
      verified: true
    }
  })

  const companyPassword = await bcrypt.hash('Company@123', 10)
  const companyUser = await prisma.user.upsert({
    where: { email: 'company@freshbit.test' },
    update: {
      password: companyPassword,
      role: 'COMPANY',
      status: 'APPROVED',
      verified: true
    },
    create: {
      email: 'company@freshbit.test',
      password: companyPassword,
      role: 'COMPANY',
      status: 'APPROVED',
      verified: true
    }
  })

  const company = await prisma.company.upsert({
    where: { userId: companyUser.id },
    update: {},
    create: {
      name: 'FreshBit Co',
      domain: 'freshbit.example',
      approved: true,
      userId: companyUser.id
    }
  })

  const college1Password = await bcrypt.hash('College1@123', 10)
  const collegeUser1 = await prisma.user.upsert({
    where: { email: 'college1@freshbit.test' },
    update: {
      password: college1Password,
      role: 'COLLEGE',
      status: 'APPROVED',
      verified: true
    },
    create: {
      email: 'college1@freshbit.test',
      password: college1Password,
      role: 'COLLEGE',
      status: 'APPROVED',
      verified: true
    }
  })

  const college2Password = await bcrypt.hash('College2@123', 10)
  const collegeUser2 = await prisma.user.upsert({
    where: { email: 'college2@freshbit.test' },
    update: {
      password: college2Password,
      role: 'COLLEGE',
      status: 'APPROVED',
      verified: true
    },
    create: {
      email: 'college2@freshbit.test',
      password: college2Password,
      role: 'COLLEGE',
      status: 'APPROVED',
      verified: true
    }
  })

  const college1 = await prisma.college.upsert({
    where: { userId: collegeUser1.id },
    update: {},
    create: {
      name: 'Alpha College',
      city: 'City A',
      state: 'State A',
      tier: 'Tier 2',
      approved: true,
      userId: collegeUser1.id
    }
  })

  const college2 = await prisma.college.upsert({
    where: { userId: collegeUser2.id },
    update: {},
    create: {
      name: 'Beta College',
      city: 'City B',
      state: 'State B',
      tier: 'Tier 1',
      approved: true,
      userId: collegeUser2.id
    }
  })

  const drive = await prisma.drive.upsert({
    where: { id: 'test-drive-1' },
    update: {},
    create: {
      id: 'test-drive-1',
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
