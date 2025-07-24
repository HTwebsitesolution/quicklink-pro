const asyncHandler = require('express-async-handler');
const Link = require('../models/Link');
const Analytics = require('../models/Analytics');

// @desc    Get all links with pagination
// @route   GET /api/admin/links
// @access  Private (add auth middleware later)
const getAllLinks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const skip = (page - 1) * limit;

  // Build search query
  let query = {};
  if (search) {
    query = {
      $or: [
        { shortCode: { $regex: search, $options: 'i' } },
        { originalUrl: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    };
  }

  const total = await Link.countDocuments(query);
  const links = await Link.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .select('-__v');

  res.status(200).json({
    success: true,
    data: {
      links,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    },
  });
});

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private
const getSystemStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Links statistics
  const totalLinks = await Link.countDocuments();
  const activeLinks = await Link.countDocuments({ isActive: true });
  const expiredLinks = await Link.countDocuments({
    expiration: { $lt: now }
  });
  const linksToday = await Link.countDocuments({
    createdAt: { $gte: today }
  });
  const linksThisWeek = await Link.countDocuments({
    createdAt: { $gte: thisWeek }
  });
  const linksThisMonth = await Link.countDocuments({
    createdAt: { $gte: thisMonth }
  });

  // Click statistics
  const totalClicks = await Analytics.countDocuments();
  const clicksToday = await Analytics.countDocuments({
    clickedAt: { $gte: today }
  });
  const clicksYesterday = await Analytics.countDocuments({
    clickedAt: { $gte: yesterday, $lt: today }
  });
  const clicksThisWeek = await Analytics.countDocuments({
    clickedAt: { $gte: thisWeek }
  });
  const clicksThisMonth = await Analytics.countDocuments({
    clickedAt: { $gte: thisMonth }
  });
  const clicksLastMonth = await Analytics.countDocuments({
    clickedAt: { $gte: lastMonth, $lt: thisMonth }
  });

  // Growth calculations
  const linkGrowth = linksThisMonth > 0 && linksThisWeek > 0 
    ? ((linksThisWeek / linksThisMonth) * 100).toFixed(1)
    : 0;
  
  const clickGrowth = clicksLastMonth > 0 
    ? (((clicksThisMonth - clicksLastMonth) / clicksLastMonth) * 100).toFixed(1)
    : 0;

  // Top countries
  const topCountries = await Analytics.aggregate([
    {
      $group: {
        _id: '$country',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 5 }
  ]);

  // Top devices
  const topDevices = await Analytics.aggregate([
    {
      $group: {
        _id: '$device',
        clicks: { $sum: 1 }
      }
    },
    { $sort: { clicks: -1 } },
    { $limit: 5 }
  ]);

  // Daily clicks for the last 30 days
  const dailyClicks = await Analytics.aggregate([
    {
      $match: {
        clickedAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$clickedAt' },
          month: { $month: '$clickedAt' },
          day: { $dayOfMonth: '$clickedAt' }
        },
        clicks: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalLinks,
        activeLinks,
        expiredLinks,
        totalClicks,
        avgClicksPerLink: totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0,
      },
      growth: {
        linksToday,
        linksThisWeek,
        linksThisMonth,
        linkGrowth: parseFloat(linkGrowth),
        clicksToday,
        clicksYesterday,
        clicksThisWeek,
        clicksThisMonth,
        clickGrowth: parseFloat(clickGrowth),
      },
      demographics: {
        topCountries: topCountries.map(item => ({
          country: item._id || 'Unknown',
          clicks: item.clicks
        })),
        topDevices: topDevices.map(item => ({
          device: item._id || 'Unknown',
          clicks: item.clicks
        })),
      },
      dailyClicks: dailyClicks.map(item => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        clicks: item.clicks
      })),
    },
  });
});

// @desc    Delete a link by ID
// @route   DELETE /api/admin/links/:id
// @access  Private
const deleteLink = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const link = await Link.findById(id);

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  // Delete associated analytics
  await Analytics.deleteMany({ linkId: id });
  
  // Delete the link
  await Link.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Link and associated analytics deleted successfully',
  });
});

// @desc    Toggle link active status
// @route   PUT /api/admin/links/:id/toggle
// @access  Private
const toggleLinkStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const link = await Link.findById(id);

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  link.isActive = !link.isActive;
  await link.save();

  res.status(200).json({
    success: true,
    data: {
      id: link._id,
      shortCode: link.shortCode,
      isActive: link.isActive,
    },
    message: `Link ${link.isActive ? 'activated' : 'deactivated'} successfully`,
  });
});

// @desc    Export links to CSV
// @route   GET /api/admin/export/csv
// @access  Private
const exportLinksCSV = asyncHandler(async (req, res) => {
  const links = await Link.find({})
    .sort({ createdAt: -1 })
    .select('-__v');

  // CSV headers
  const csvHeaders = [
    'Short Code',
    'Original URL',
    'Description',
    'Clicks',
    'Created At',
    'Last Clicked',
    'Expiration',
    'Is Active'
  ].join(',');

  // CSV rows
  const csvRows = links.map(link => [
    link.shortCode,
    `"${link.originalUrl}"`,
    `"${link.description || ''}"`,
    link.clicks,
    link.createdAt.toISOString(),
    link.lastClicked ? link.lastClicked.toISOString() : '',
    link.expiration ? link.expiration.toISOString() : '',
    link.isActive
  ].join(',')).join('\n');

  const csvContent = csvHeaders + '\n' + csvRows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="links-export.csv"');
  res.status(200).send(csvContent);
});

// @desc    Cleanup expired links
// @route   POST /api/admin/cleanup-expired
// @access  Private
const cleanupExpiredLinks = asyncHandler(async (req, res) => {
  const now = new Date();
  
  // Find expired links
  const expiredLinks = await Link.find({
    expiration: { $lt: now }
  });

  let deletedCount = 0;
  let analyticsDeletedCount = 0;

  for (const link of expiredLinks) {
    // Delete associated analytics
    const analyticsResult = await Analytics.deleteMany({ linkId: link._id });
    analyticsDeletedCount += analyticsResult.deletedCount;
    
    // Delete the link
    await Link.findByIdAndDelete(link._id);
    deletedCount++;
  }

  res.status(200).json({
    success: true,
    data: {
      linksDeleted: deletedCount,
      analyticsDeleted: analyticsDeletedCount,
    },
    message: `Cleanup completed: ${deletedCount} expired links and ${analyticsDeletedCount} analytics records removed`,
  });
});

module.exports = {
  getAllLinks,
  getSystemStats,
  deleteLink,
  toggleLinkStatus,
  exportLinksCSV,
  cleanupExpiredLinks,
};
