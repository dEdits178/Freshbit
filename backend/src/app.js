const express = require('express')
const cors = require('cors')
const authRoutes = require('./modules/auth/auth.routes')
const driveRoutes = require('./modules/drive/drive.routes')
const collegeRoutes = require('./modules/college/college.routes')
const fileRoutes = require('./modules/file/file.routes')
const studentRoutes = require('./modules/student/student.routes')
const applicationRoutes = require('./modules/application/application.routes')
const stageRoutes = require('./modules/stage/stage.routes')
const selectionRoutes = require('./modules/selection/selection.routes')
const errorHandler = require('./middleware/error.middleware')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'FreshBit API Running',
    version: '1.0.0',
    stage: 'Stage 9 - Shortlist & Final Selection Engine'
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/drives', driveRoutes)
app.use('/api/college', collegeRoutes)
app.use('/api', fileRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/stages', stageRoutes)
app.use('/api/selection', selectionRoutes)

// Error handling middleware (must be last)
app.use(errorHandler)

module.exports = app
