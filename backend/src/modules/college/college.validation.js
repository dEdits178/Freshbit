const AppError = require('../../utils/AppError')

const validateUpdateProfile = (data) => {
  const { name, city, state, tier, approved, userId } = data

  // Prevent updating protected fields
  if (approved !== undefined) {
    throw new AppError('Cannot update approved field', 400)
  }

  if (userId !== undefined) {
    throw new AppError('Cannot update userId field', 400)
  }

  // At least one field must be provided
  if (!name && !city && !state && !tier) {
    throw new AppError('At least one field must be provided for update', 400)
  }

  // Validate field values if provided
  if (name !== undefined && name.trim().length === 0) {
    throw new AppError('Name cannot be empty', 400)
  }

  if (city !== undefined && city.trim().length === 0) {
    throw new AppError('City cannot be empty', 400)
  }

  if (state !== undefined && state.trim().length === 0) {
    throw new AppError('State cannot be empty', 400)
  }

  return true
}

const validateDriveId = (driveId) => {
  if (!driveId) {
    throw new AppError('Drive ID is required', 400)
  }
  return true
}

module.exports = {
  validateUpdateProfile,
  validateDriveId
}
