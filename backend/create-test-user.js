const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestCollegeUser() {
  try {
    const password = 'test123'
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update the existing college user with a known password
    const updatedUser = await prisma.user.update({
      where: { email: 'college1@freshbit.test' },
      data: { 
        password: hashedPassword,
        verified: true,
        status: 'APPROVED'
      }
    })

    console.log('Test college user updated:')
    console.log('Email: college1@freshbit.test')
    console.log('Password: test123')
    console.log('User ID:', updatedUser.id)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestCollegeUser()
