const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Analytics routes
router.get('/link/:shortCode', analyticsController.getLinkAnalytics);
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/link/:shortCode/detailed', analyticsController.getDetailedAnalytics);
router.get('/top-links', analyticsController.getTopLinks);
router.get('/recent-clicks', analyticsController.getRecentClicks);
router.get('/geographic/:shortCode', analyticsController.getGeographicData);
router.get('/devices/:shortCode', analyticsController.getDeviceData);
router.get('/browsers/:shortCode', analyticsController.getBrowserData);
router.get('/referrers/:shortCode', analyticsController.getReferrerData);

module.exports = router;
