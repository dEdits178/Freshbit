const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()) : []),
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FreshBit API Running',
    version: '1.0.0',
    stage: 'Phase 10.2 - Admin Dashboard Backend'
  })
})

// Auth routes
app.use('/api/auth', authRoutes)

// Admin routes
app.use('/api/admin', adminRoutes)

// College routes
app.use('/api/college', require('./modules/college/college.routes'))

// Core modules
app.use('/api/drives', require('./modules/drive/drive.routes'))
app.use('/api/stages', require('./modules/stage/stage.routes'))
app.use('/api/applications', require('./modules/application/application.routes'))
app.use('/api/files', require('./modules/file/file.routes'))
app.use('/api/company', require('./modules/companyCollege/companyCollege.routes'))
app.use('/api/selection', require('./modules/selection/selection.routes'))

// 404 for unknown endpoints
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
})

// Error handling middleware (must be last)
app.use(errorHandler)

module.exports = app
