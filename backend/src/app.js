const express = require('express')
const cors = require('cors')
const authRoutes = require('./modules/auth/auth.routes')
const driveRoutes = require('./modules/drive/drive.routes')
const collegeRoutes = require('./modules/college/college.routes')
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
    stage: 'Stage 4 - Drive & College Management'
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/drives', driveRoutes)
app.use('/api/college', collegeRoutes)

// Error handling middleware (must be last)
app.use(errorHandler)

module.exports = app
