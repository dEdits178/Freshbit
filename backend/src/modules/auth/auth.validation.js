const AppError = require('../../utils/AppError')

const validateCompanyRegistration = (data) => {
  const { name, email, password, domain } = data

  if (!name || !email || !password || !domain) {
    throw new AppError('All fields are required: name, email, password, domain', 400)
  }

  if (!isValidEmail(email)) {
    throw new AppError('Invalid email format', 400)
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400)
  }

  return true
}

const validateCollegeRegistration = (data) => {
  const { name, email, password, domain, city, state } = data

  if (!name || !email || !password || !domain || !city || !state) {
    throw new AppError('All fields are required: name, email, password, domain, city, state', 400)
  }

  if (!isValidEmail(email)) {
    throw new AppError('Invalid email format', 400)
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400)
  }

  return true
}

const validateLogin = (data) => {
  const { email, password } = data

  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }

  if (!isValidEmail(email)) {
    throw new AppError('Invalid email format', 400)
  }

  return true
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

module.exports = {
  validateCompanyRegistration,
  validateCollegeRegistration,
  validateLogin
}
