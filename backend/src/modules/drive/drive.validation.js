const AppError = require('../../utils/AppError')

const validateCreateDrive = (data) => {
  const { roleTitle, salary, description, collegeIds } = data

  if (!roleTitle || !salary || !description || !collegeIds) {
    throw new AppError('All fields are required: roleTitle, salary, description, collegeIds', 400)
  }

  if (!Array.isArray(collegeIds) || collegeIds.length === 0) {
    throw new AppError('collegeIds must be a non-empty array', 400)
  }

  if (roleTitle.trim().length === 0) {
    throw new AppError('roleTitle cannot be empty', 400)
  }

  if (description.trim().length === 0) {
    throw new AppError('description cannot be empty', 400)
  }

  const salaryNum = parseInt(salary)
  if (isNaN(salaryNum) || salaryNum <= 0) {
    throw new AppError('salary must be a positive number', 400)
  }

  return true
}

const validateDriveId = (driveId) => {
  if (!driveId) {
    throw new AppError('Drive ID is required', 400)
  }
  return true
}

const validateCollegeResponse = (data) => {
  const { action } = data

  if (!action) {
    throw new AppError('Action is required', 400)
  }

  if (!['ACCEPT', 'REJECT'].includes(action)) {
    throw new AppError('Action must be either ACCEPT or REJECT', 400)
  }

  return true
}

const validateAdminOverride = (data) => {
  const { action } = data

  if (!action) {
    throw new AppError('Action is required', 400)
  }

  if (!['FORCE_ACCEPT', 'REJECT'].includes(action)) {
    throw new AppError('Action must be either FORCE_ACCEPT or REJECT', 400)
  }

  return true
}

module.exports = {
  validateCreateDrive,
  validateDriveId,
  validateCollegeResponse,
  validateAdminOverride
}
