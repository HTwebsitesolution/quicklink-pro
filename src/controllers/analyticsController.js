const asyncHandler = require('express-async-handler');
const Link = require('../models/Link');
const Analytics = require('../models/Analytics');

// @desc    Get analytics for a specific link
// @route   GET /api/analytics/link/:shortCode
// @access  Public
const getLinkAnalytics = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;
  const days = parseInt(req.query.days) || 30;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  // Get basic analytics
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const analytics = await Analytics.aggregate([
    {
      $match: {
        linkId: link._id,
        clickedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$clickedAt' },
          month: { $month: '$clickedAt' },
          day: { $dayOfMonth: '$clickedAt' }
        },
        clicks: { $sum: 1 },
        uniqueIPs: { $addToSet: '$ipAddress' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Get total stats
  const totalStats = await Analytics.aggregate([
    { $match: { linkId: link._id } },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$ipAddress' },
        countries: { $addToSet: '$country' },
        devices: { $addToSet: '$device' },
        browsers: { $addToSet: '$browser' }
      }
    }
  ]);

  const stats = totalStats[0] || {
    totalClicks: 0,
    uniqueClicks: [],
    countries: [],
    devices: [],
    browsers: []
  };

  res.status(200).json({
    success: true,
    data: {
      link: {
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        createdAt: link.createdAt,
      },
      stats: {
        totalClicks: stats.totalClicks,
        uniqueClicks: stats.uniqueClicks.length,
        countries: stats.countries.length,
        devices: stats.devices.length,
        browsers: stats.browsers.length,
      },
      dailyAnalytics: analytics.map(item => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        clicks: item.clicks,
        uniqueClicks: item.uniqueIPs.length,
      })),
    },
  });
});

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Public
const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Total links
  const totalLinks = await Link.countDocuments();
  
  // Total clicks
  const totalClicks = await Analytics.countDocuments();
  
  // Today's clicks
  const todayClicks = await Analytics.countDocuments({
    clickedAt: { $gte: startOfToday }
  });
  
  // This week's clicks
  const weekClicks = await Analytics.countDocuments({
    clickedAt: { $gte: startOfWeek }
  });
  
  // This month's clicks
  const monthClicks = await Analytics.countDocuments({
    clickedAt: { $gte: startOfMonth }
  });

  // Top links by clicks
  const topLinks = await Link.find()
    .sort({ clicks: -1 })
    .limit(5)
    .select('shortCode originalUrl clicks createdAt');

  // Recent clicks
  const recentClicks = await Analytics.find()
    .populate('linkId', 'shortCode originalUrl')
    .sort({ clickedAt: -1 })
    .limit(10)
    .select('linkId clickedAt country device browser');

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalLinks,
        totalClicks,
        todayClicks,
        weekClicks,
        monthClicks,
        avgClicksPerLink: totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0,
      },
      topLinks: topLinks.map(link => ({
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        clicks: link.clicks,
        createdAt: link.createdAt,
      })),
      recentClicks: recentClicks.map(click => ({
        shortCode: click.linkId?.shortCode,
        originalUrl: click.linkId?.originalUrl,
        clickedAt: click.clickedAt,
        country: click.country,
        device: click.device,
        browser: click.browser,
      })),
    },
  });
});

// @desc    Get detailed analytics for a link
// @route   GET /api/analytics/link/:shortCode/detailed
// @access  Public
const getDetailedAnalytics = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  // Get geographic data
  const geographicData = await Analytics.aggregate([
    { $match: { linkId: link._id } },
    {
      $group: {
        _id: '$country',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 10 }
  ]);

  // Get device data
  const deviceData = await Analytics.aggregate([
    { $match: { linkId: link._id } },
    {
      $group: {
        _id: '$device',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } }
  ]);

  // Get browser data
  const browserData = await Analytics.aggregate([
    { $match: { linkId: link._id } },
    {
      $group: {
        _id: '$browser',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } }
  ]);

  // Get referrer data
  const referrerData = await Analytics.aggregate([
    { $match: { linkId: link._id } },
    {
      $group: {
        _id: '$referrer',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      geographic: geographicData.map(item => ({
        country: item._id,
        clicks: item.clicks
      })),
      devices: deviceData.map(item => ({
        device: item._id,
        clicks: item.clicks
      })),
      browsers: browserData.map(item => ({
        browser: item._id,
        clicks: item.clicks
      })),
      referrers: referrerData.map(item => ({
        referrer: item._id,
        clicks: item.clicks
      })),
    },
  });
});

// @desc    Get top performing links
// @route   GET /api/analytics/top-links
// @access  Public
const getTopLinks = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const period = req.query.period || 'all'; // all, today, week, month

  let dateFilter = {};
  const now = new Date();

  switch (period) {
    case 'today':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      };
      break;
    case 'week':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case 'month':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
      break;
  }

  const topLinks = await Link.find(dateFilter)
    .sort({ clicks: -1 })
    .limit(limit)
    .select('shortCode originalUrl clicks createdAt description');

  res.status(200).json({
    success: true,
    data: topLinks.map(link => ({
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      description: link.description,
      clicks: link.clicks,
      createdAt: link.createdAt,
    })),
  });
});

// @desc    Get recent clicks
// @route   GET /api/analytics/recent-clicks
// @access  Public
const getRecentClicks = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  const recentClicks = await Analytics.find()
    .populate('linkId', 'shortCode originalUrl')
    .sort({ clickedAt: -1 })
    .limit(limit)
    .select('linkId clickedAt country device browser ipAddress');

  res.status(200).json({
    success: true,
    data: recentClicks.map(click => ({
      shortCode: click.linkId?.shortCode,
      originalUrl: click.linkId?.originalUrl,
      clickedAt: click.clickedAt,
      country: click.country,
      device: click.device,
      browser: click.browser,
      ipAddress: click.ipAddress.replace(/\.\d+$/, '.***'), // Partially hide IP
    })),
  });
});

// @desc    Get geographic data for a link
// @route   GET /api/analytics/geographic/:shortCode
// @access  Public
const getGeographicData = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  const geographicData = await Analytics.getTopCountries(link._id, 20);

  res.status(200).json({
    success: true,
    data: geographicData.map(item => ({
      country: item._id || 'Unknown',
      clicks: item.clicks
    })),
  });
});

// @desc    Get device data for a link
// @route   GET /api/analytics/devices/:shortCode
// @access  Public
const getDeviceData = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  const deviceData = await Analytics.getDeviceStats(link._id);

  res.status(200).json({
    success: true,
    data: deviceData.map(item => ({
      device: item._id || 'Unknown',
      clicks: item.clicks
    })),
  });
});

// @desc    Get browser data for a link
// @route   GET /api/analytics/browsers/:shortCode
// @access  Public
const getBrowserData = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  const browserData = await Analytics.getBrowserStats(link._id);

  res.status(200).json({
    success: true,
    data: browserData.map(item => ({
      browser: item._id || 'Unknown',
      clicks: item.clicks
    })),
  });
});

// @desc    Get referrer data for a link
// @route   GET /api/analytics/referrers/:shortCode
// @access  Public
const getReferrerData = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  const referrerData = await Analytics.aggregate([
    { $match: { linkId: link._id } },
    {
      $group: {
        _id: '$referrer',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 15 }
  ]);

  res.status(200).json({
    success: true,
    data: referrerData.map(item => ({
      referrer: item._id || 'Direct',
      clicks: item.clicks
    })),
  });
});

module.exports = {
  getLinkAnalytics,
  getDashboardStats,
  getDetailedAnalytics,
  getTopLinks,
  getRecentClicks,
  getGeographicData,
  getDeviceData,
  getBrowserData,
  getReferrerData,
};
