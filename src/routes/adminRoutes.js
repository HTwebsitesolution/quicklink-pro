const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Admin routes (you can add authentication middleware here later)
router.get('/links', adminController.getAllLinks);
router.get('/stats', adminController.getSystemStats);
router.delete('/links/:id', adminController.deleteLink);
router.put('/links/:id/toggle', adminController.toggleLinkStatus);
router.get('/export/csv', adminController.exportLinksCSV);
router.post('/cleanup-expired', adminController.cleanupExpiredLinks);

module.exports = router;
