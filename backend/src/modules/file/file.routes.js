const express = require('express')
const { authenticate } = require('../../middleware/auth.middleware')
const { requireRole } = require('../../middleware/role.middleware')
const asyncHandler = require('../../../utils/asyncHandler')
const { upload } = require('./file.middleware')
const fileController = require('./file.controller')
const AppError = require('../../utils/AppError')

const router = express.Router()

router.use(authenticate)

const validateFileType = (req, res, next) => {
  const { fileType } = req.body
  const allowed = new Set(['JD', 'STUDENT_LIST', 'SHORTLIST', 'FINAL_LIST'])
  if (!fileType || !allowed.has(String(fileType))) {
    return next(new AppError('Invalid or missing fileType', 400))
  }
  next()
}

// COLLEGE
const collegeRouter = express.Router()
collegeRouter.use(requireRole('COLLEGE'))

collegeRouter.post('/drives/:driveId/files/upload',
  upload.single('file'),
  validateFileType,
  fileController.uploadCollege
)

collegeRouter.get('/drives/:driveId/files',
  fileController.listCollege
)

collegeRouter.post('/files/:fileId/convert',
  fileController.convertCollege
)

collegeRouter.get('/files/:fileId/export',
  fileController.exportCollege
)

// ADMIN (convert only)
const adminRouter = express.Router()
adminRouter.use(requireRole('ADMIN'))
adminRouter.post('/files/:fileId/convert', fileController.convertAdmin)
adminRouter.get('/files/:fileId/export', fileController.exportAdmin)

// COMMON: secure file streaming (College, Company, Admin)
router.get('/files/:fileId', fileController.getFile)

router.use('/college', collegeRouter)
router.use('/admin', adminRouter)

module.exports = router
