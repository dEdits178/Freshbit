const multer = require('multer')
const path = require('path')
const fs = require('fs')
const AppError = require('../../utils/AppError')

const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext)
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${base}-${unique}${ext}`)
  }
})

const allowedExtensions = new Set(['.csv', '.xlsx', '.xls', '.pdf', '.doc', '.docx'])
const allowedMimes = new Set([
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!allowedExtensions.has(ext)) {
    return cb(new AppError('File extension not allowed', 400))
  }
  if (!allowedMimes.has(file.mimetype)) {
    return cb(new AppError('MIME type not allowed', 400))
  }
  cb(null, true)
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
})

module.exports = {
  upload,
  UPLOAD_DIR
}
