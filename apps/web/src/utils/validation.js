export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(String(email || '').trim())
}

export const validatePassword = (password) => {
  const value = String(password || '')
  if (value.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' }
  }
  if (!/[A-Za-z]/.test(value)) {
    return { valid: false, message: 'Password must include at least one letter' }
  }
  if (!/\d/.test(value)) {
    return { valid: false, message: 'Password must include at least one number' }
  }
  return { valid: true, message: 'Password is valid' }
}

export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword
}

export const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${fieldName} is required`
  }
  return null
}
