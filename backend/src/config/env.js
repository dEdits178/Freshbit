require('dotenv').config()

const config = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  resetTokenExpiry: process.env.RESET_TOKEN_EXPIRY || '1h',
  verificationTokenExpiry: process.env.VERIFICATION_TOKEN_EXPIRY || '24h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  emailEnabled: String(process.env.EMAIL_ENABLED || 'false').toLowerCase() === 'true',
  emailFrom: process.env.EMAIL_FROM || 'noreply@freshbit.com'
}

module.exports = config
