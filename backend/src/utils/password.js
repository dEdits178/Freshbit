const bcrypt = require('bcrypt')

const SALT_ROUNDS = 10

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS)

const comparePassword = async (password, hash) => bcrypt.compare(password, hash)

const validatePasswordStrength = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' }
  }

  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)

  if (!hasLetter || !hasNumber) {
    return { valid: false, message: 'Password must contain at least one letter and one number' }
  }

  return { valid: true, message: 'Password is strong' }
}

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength
}
