const AppError = require('../../utils/AppError')

const validateBulkUpload = (body) => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Invalid request body', 400)
  }

  const { students } = body
  if (!Array.isArray(students) || students.length === 0) {
    throw new AppError('students must be a non-empty array', 400)
  }

  for (const s of students) {
    if (!s || typeof s !== 'object') {
      throw new AppError('Each student must be an object', 400)
    }
    if (!s.name || typeof s.name !== 'string') {
      throw new AppError('Student name is required', 400)
    }
    if (!s.email || typeof s.email !== 'string') {
      throw new AppError('Student email is required', 400)
    }
    if (typeof s.cgpa !== 'number') {
      throw new AppError('Student cgpa must be a number', 400)
    }
    if (s.cgpa < 0 || s.cgpa > 10) {
      throw new AppError('Student cgpa must be between 0 and 10', 400)
    }
  }
}

module.exports = {
  validateBulkUpload
}
