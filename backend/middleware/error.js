const logger = require('../config/logger')

module.exports = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'

  logger.error({ err, status, path: req.path }, message)

  res.status(status).json({ error: message })
}
