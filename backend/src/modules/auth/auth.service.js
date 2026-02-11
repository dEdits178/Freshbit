const bcrypt = require('bcryptjs')
const prisma = require('../../../prisma/client')
const { generateToken } = require('../../utils/jwt')
const AppError = require('../../utils/AppError')

class AuthService {
  async registerCompany({ name, email, password, domain }) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new AppError('Email already exists', 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'COMPANY',
        status: 'PENDING',
        verified: false,
        company: {
          create: {
            name,
            domain,
            approved: false
          }
        }
      },
      include: {
        company: true
      }
    })

    const { password: _, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      message: 'Company registration successful. Pending admin approval.'
    }
  }

  async registerCollege({ name, email, password, domain, city, state }) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new AppError('Email already exists', 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'COLLEGE',
        status: 'PENDING',
        verified: false,
        college: {
          create: {
            name,
            city,
            state,
            tier: 'N/A',
            approved: false
          }
        }
      },
      include: {
        college: true
      }
    })

    const { password: _, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      message: 'College registration successful. Pending admin approval.'
    }
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        college: true
      }
    })

    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401)
    }

    if (!user.verified) {
      throw new AppError('Account not verified. Please wait for admin approval.', 403)
    }

    if (user.status !== 'APPROVED') {
      throw new AppError('Account not approved. Please contact admin.', 403)
    }

    const token = generateToken({
      userId: user.id,
      role: user.role
    })

    const { password: _, ...userWithoutPassword } = user

    return {
      token,
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
        status: userWithoutPassword.status,
        verified: userWithoutPassword.verified
      }
    }
  }

  async approveUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          status: 'APPROVED',
          verified: true
        }
      })

      if (user.role === 'COMPANY') {
        await tx.company.update({
          where: { userId },
          data: { approved: true }
        })
      } else if (user.role === 'COLLEGE') {
        await tx.college.update({
          where: { userId },
          data: { approved: true }
        })
      }

      return updated
    })

    const { password: _, ...userWithoutPassword } = updatedUser

    return {
      user: userWithoutPassword,
      message: 'User approved successfully'
    }
  }
}

module.exports = new AuthService()
