const nodemailer = require('nodemailer')

class EmailService {
  constructor() {
    this.isEnabled = String(process.env.EMAIL_ENABLED || 'false').toLowerCase() === 'true'
    this.from = process.env.EMAIL_FROM || 'noreply@freshbit.com'
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  }

  async getTransporter() {
    if (!this.isEnabled) return null

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      throw new Error('SMTP configuration is missing while EMAIL_ENABLED=true')
    }

    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    })
  }

  async sendMail(to, subject, html, text) {
    if (!this.isEnabled) {
      console.log('\n📧 [DEV EMAIL MODE]')
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(text)
      console.log('---\n')
      return
    }

    const transporter = await this.getTransporter()
    await transporter.sendMail({
      from: this.from,
      to,
      subject,
      text,
      html
    })
  }

  async sendVerificationEmail(email, token) {
    const verifyLink = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`

    await this.sendMail(
      email,
      'Verify your FreshBit account',
      `<p>Welcome to FreshBit!</p><p>Please verify your account by clicking <a href="${verifyLink}">this link</a>.</p>`,
      `Welcome to FreshBit! Verify your account: ${verifyLink}`
    )
  }

  async sendPasswordResetEmail(email, token) {
    const resetLink = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`

    await this.sendMail(
      email,
      'Reset your FreshBit password',
      `<p>You requested a password reset.</p><p>Reset your password using <a href="${resetLink}">this link</a>.</p>`,
      `You requested a password reset. Use this link: ${resetLink}`
    )
  }

  async sendWelcomeEmail(email, name) {
    await this.sendMail(
      email,
      'Welcome to FreshBit',
      `<p>Hi ${name},</p><p>Your FreshBit account is now ready.</p>`,
      `Hi ${name}, your FreshBit account is now ready.`
    )
  }
}

module.exports = new EmailService()
