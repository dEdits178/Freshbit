const AppError = require('../../utils/AppError')

const VALID_STAGES = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL']

const validateStageParam = (stage) => {
  if (!VALID_STAGES.includes(stage)) {
    throw new AppError('Invalid stage', 400)
  }
}

const validateShortlistBody = (body) => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Invalid request body', 400)
  }
  const { studentIds } = body
  if (!Array.isArray(studentIds)) {
    throw new AppError('studentIds must be an array', 400)
  }
  for (const id of studentIds) {
    if (typeof id !== 'string') {
      throw new AppError('studentIds must contain string IDs', 400)
    }
  }
}

const validateFinalizeBody = (body) => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Invalid request body', 400)
  }
  const { selectedStudentIds } = body
  if (!Array.isArray(selectedStudentIds)) {
    throw new AppError('selectedStudentIds must be an array', 400)
  }
  for (const id of selectedStudentIds) {
    if (typeof id !== 'string') {
      throw new AppError('selectedStudentIds must contain string IDs', 400)
    }
  }
}

module.exports = {
  validateStageParam,
  validateShortlistBody,
  validateFinalizeBody,
  VALID_STAGES
}
