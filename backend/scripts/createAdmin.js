const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = 'admin@freshbit.com'
    const password = 'admin123'

    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      console.log('Admin user already exists!')
      console.log('Email:', email)
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
        verified: true
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('User ID:', admin.id)
    console.log('\n⚠️  Please change the password after first login!')
  } catch (error) {
    console.error('Error creating admin:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
