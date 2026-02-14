const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard stats
router.get('/stats', adminController.getStats);

// Drives management
router.get('/drives', adminController.getDrives);
router.get('/drives/:id', adminController.getDriveById);
router.post('/drives/:id/activate-next-stage', adminController.activateNextStage);
router.post('/drives/:id/close', adminController.closeDrive);

// Colleges management
router.get('/colleges', adminController.getColleges);
router.post('/colleges', adminController.createCollege);
router.put('/colleges/:id', adminController.updateCollege);
router.delete('/colleges/:id', adminController.deleteCollege);

// Companies management
router.get('/companies', adminController.getCompanies);

// Analytics
router.get('/analytics/overview', adminController.getAnalytics);

module.exports = router;
