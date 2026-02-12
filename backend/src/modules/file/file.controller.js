const fileService = require('./file.service')
const { successResponse } = require('../../utils/response')
const asyncHandler = require('../../../utils/asyncHandler')

class FileController {
  uploadCollege = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const { fileType } = req.body
    const info = await fileService.uploadFileCollege(req.user.id, driveId, req.file, fileType)
    successResponse(res, 201, 'File uploaded successfully', info)
  })

  listCollege = asyncHandler(async (req, res) => {
    const { driveId } = req.params
    const files = await fileService.listFilesForCollege(req.user.id, driveId)
    successResponse(res, 200, 'Files retrieved successfully', files)
  })

  getFile = asyncHandler(async (req, res) => {
    const { fileId } = req.params
    const file = await fileService.getFileWithAccess(req.user, fileId)
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`)
    const stream = require('fs').createReadStream(file.fileUrl)
    stream.on('error', (err) => {
      res.status(500).end()
    })
    stream.pipe(res)
  })

  convertCollege = asyncHandler(async (req, res) => {
    const { fileId } = req.params
    const preview = await fileService.convertFileCollege(req.user.id, fileId)
    successResponse(res, 200, 'Conversion successful', preview)
  })

  convertAdmin = asyncHandler(async (req, res) => {
    const { fileId } = req.params
    const preview = await fileService.convertFileAdmin(fileId)
    successResponse(res, 200, 'Conversion successful', preview)
  })
}

module.exports = new FileController()
