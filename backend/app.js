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

// Import routes
const authRoutes = require('./src/modules/auth/auth.routes')
const collegeRoutes = require('./src/modules/college/college.routes')
const driveRoutes = require('./src/modules/drive/drive.routes')
const studentRoutes = require('./src/modules/student/student.routes')
const fileRoutes = require('./src/modules/file/file.routes')
const applicationRoutes = require('./src/modules/application/application.routes')
const selectionRoutes = require('./src/modules/selection/selection.routes')

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/colleges', collegeRoutes)
app.use('/api/drives', driveRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/selection', selectionRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started')
})
