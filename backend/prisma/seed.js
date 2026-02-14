const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function upsertUser({ email, rawPassword, role }) {
  const password = await bcrypt.hash(rawPassword, 10)

  return prisma.user.upsert({
    where: { email },
    update: {
      password,
      role,
      status: 'APPROVED',
      verified: true,
      // audit flags not present in current schema
    },
    create: {
      email,
      password,
      role,
      status: 'APPROVED',
      verified: true,
      // audit flags not present in current schema
    }
  })
}

async function main() {
  const admin = await upsertUser({ email: 'admin@freshbit.com', rawPassword: 'Admin@123', role: 'ADMIN' })

  const companyUser = await upsertUser({ email: 'company@freshbit.com', rawPassword: 'Company@123', role: 'COMPANY' })

  const collegeUser = await upsertUser({ email: 'college@freshbit.com', rawPassword: 'College@123', role: 'COLLEGE' })

  await prisma.company.upsert({
    where: { userId: companyUser.id },
    update: { name: 'FreshBit Co', domain: 'freshbit.example', approved: true },
    create: { userId: companyUser.id, name: 'FreshBit Co', domain: 'freshbit.example', approved: true }
  })

  await prisma.college.upsert({
    where: { userId: collegeUser.id },
    update: { name: 'Alpha College', city: 'City A', state: 'State A', tier: 'A', approved: true },
    create: { userId: collegeUser.id, name: 'Alpha College', city: 'City A', state: 'State A', tier: 'A', approved: true }
  })

  console.log('✅ Seeded users:')
  console.log(`- ADMIN: ${admin.email}`)
  console.log(`- COMPANY: ${companyUser.email}`)
  console.log(`- COLLEGE: ${collegeUser.email}`)
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
