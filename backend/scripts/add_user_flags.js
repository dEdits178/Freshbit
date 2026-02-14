const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS name TEXT DEFAULT ''`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'APPROVED'`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT FALSE`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationToken" TEXT`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organizationName" TEXT`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP NULL`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()`)
    console.log('User table updated: added status and verified columns')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('Failed to add user flags:', e && e.stack ? e.stack : e)
  process.exit(1)
})
