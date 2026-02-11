require('dotenv').config()
const express = require('express')
const cors = require('cors')
const logger = require('./config/logger')
const errorHandler = require('./middleware/error')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'FreshBit API Running' })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started')
})
