require('dotenv').config()
const app = require('./app')
const logger = require('../config/logger')
const config = require('./config/env')

const PORT = config.port

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started successfully')
})
