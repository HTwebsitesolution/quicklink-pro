const asyncHandler = require('express-async-handler');
const { nanoid } = require('nanoid');
const QRCode = require('qrcode');
const Link = require('../models/Link');
const { validateUrl, sanitizeUrl } = require('../utils/urlUtils');

// @desc    Shorten a single URL
// @route   POST /api/url/shorten
// @access  Public
const shortenUrl = asyncHandler(async (req, res) => {
  const { originalUrl, customAlias, description, expiration } = req.body;

  // Sanitize and validate URL
  const sanitizedUrl = sanitizeUrl(originalUrl);
  if (!validateUrl(sanitizedUrl)) {
    return res.status(400).json({ message: 'Invalid URL provided' });
  }

  // Check if custom alias already exists
  if (customAlias) {
    const existingLink = await Link.findOne({ shortCode: customAlias });
    if (existingLink) {
      return res.status(409).json({ message: 'Custom alias already exists' });
    }
  }

  // Generate short code
  const shortCode = customAlias || nanoid(6);

  // Create new link
  const newLink = new Link({
    originalUrl: sanitizedUrl,
    shortCode,
    customAlias: customAlias || null,
    description: description || '',
    expiration: expiration || null,
  });

  const savedLink = await newLink.save();

  res.status(201).json({
    success: true,
    data: {
      id: savedLink._id,
      originalUrl: savedLink.originalUrl,
      shortCode: savedLink.shortCode,
      shortUrl: savedLink.shortUrl,
      description: savedLink.description,
      expiration: savedLink.expiration,
      createdAt: savedLink.createdAt,
    },
  });
});

// @desc    Bulk shorten URLs
// @route   POST /api/url/bulk-shorten
// @access  Public
const bulkShortenUrls = asyncHandler(async (req, res) => {
  const { urls, prefix } = req.body;

  const results = [];
  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const originalUrl = sanitizeUrl(urls[i]);
      
      if (!validateUrl(originalUrl)) {
        errors.push({ index: i, url: urls[i], error: 'Invalid URL' });
        continue;
      }

      const shortCode = prefix ? `${prefix}-${i + 1}` : nanoid(6);

      // Check if short code already exists
      const existingLink = await Link.findOne({ shortCode });
      if (existingLink) {
        errors.push({ index: i, url: urls[i], error: 'Short code already exists' });
        continue;
      }

      const newLink = new Link({
        originalUrl,
        shortCode,
        description: `Bulk upload ${i + 1}`,
      });

      const savedLink = await newLink.save();
      
      results.push({
        index: i,
        originalUrl: savedLink.originalUrl,
        shortCode: savedLink.shortCode,
        shortUrl: savedLink.shortUrl,
      });
    } catch (error) {
      errors.push({ index: i, url: urls[i], error: error.message });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      processed: results.length,
      errors: errors.length,
      results,
      errors,
    },
  });
});

// @desc    Get link information
// @route   GET /api/url/info/:shortCode
// @access  Public
const getLinkInfo = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  // Check if link is expired
  if (link.isExpired()) {
    return res.status(410).json({ message: 'Link has expired' });
  }

  res.status(200).json({
    success: true,
    data: {
      id: link._id,
      originalUrl: link.originalUrl,
      shortCode: link.shortCode,
      shortUrl: link.shortUrl,
      description: link.description,
      clicks: link.clicks,
      expiration: link.expiration,
      createdAt: link.createdAt,
      lastClicked: link.lastClicked,
      isActive: link.isActive,
    },
  });
});

// @desc    Update link
// @route   PUT /api/url/update/:shortCode
// @access  Public
const updateLink = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;
  const { description, expiration } = req.body;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  // Update allowed fields
  if (description !== undefined) link.description = description;
  if (expiration !== undefined) link.expiration = expiration;

  const updatedLink = await link.save();

  res.status(200).json({
    success: true,
    data: {
      id: updatedLink._id,
      description: updatedLink.description,
      expiration: updatedLink.expiration,
      updatedAt: updatedLink.updatedAt,
    },
  });
});

// @desc    Delete link
// @route   DELETE /api/url/delete/:shortCode
// @access  Public
const deleteLink = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const link = await Link.findOneAndDelete({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Link deleted successfully',
  });
});

// @desc    Generate QR code for short URL
// @route   GET /api/url/qr/:shortCode
// @access  Public
const generateQRCode = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  if (link.isExpired()) {
    return res.status(410).json({ message: 'Link has expired' });
  }

  try {
    const qrCodeDataURL = await QRCode.toDataURL(link.shortUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Update QR code generated flag
    await Link.findByIdAndUpdate(link._id, { qrCodeGenerated: true });

    res.status(200).json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        shortUrl: link.shortUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating QR code' });
  }
});

// @desc    Preview link (get metadata without redirecting)
// @route   GET /api/url/preview/:shortCode
// @access  Public
const previewLink = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const link = await Link.findOne({ shortCode });

  if (!link) {
    return res.status(404).json({ message: 'Link not found' });
  }

  if (link.isExpired()) {
    return res.status(410).json({ message: 'Link has expired' });
  }

  // Get analytics summary
  const analyticsSummary = await link.getAnalyticsSummary();

  res.status(200).json({
    success: true,
    data: {
      originalUrl: link.originalUrl,
      shortUrl: link.shortUrl,
      description: link.description,
      clicks: link.clicks,
      createdAt: link.createdAt,
      analytics: analyticsSummary,
    },
  });
});

module.exports = {
  shortenUrl,
  bulkShortenUrls,
  getLinkInfo,
  updateLink,
  deleteLink,
  generateQRCode,
  previewLink,
};
