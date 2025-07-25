const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const urlRoutes = require('./src/routes/urlRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure the app listens on all interfaces for Render
app.set('port', PORT);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// More strict rate limiting for shortening endpoints
const shortenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 URL shortening requests per windowMs
  message: 'Too many URL shortening requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'QuickLink Pro API is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'QuickLink Pro API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      shorten: '/api/url/shorten',
      analytics: '/api/analytics',
      admin: '/api/admin'
    }
  });
});

// API routes
app.use('/api/url', shortenLimiter, urlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Redirect route (this should be at the root level)
app.get('/:shortCode', async (req, res) => {
  try {
    const Link = require('./src/models/Link');
    const Analytics = require('./src/models/Analytics');
    
    const { shortCode } = req.params;
    
    // Find the link
    const link = await Link.findOne({ shortCode });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }
    
    // Check if link has expired
    if (link.expiration && new Date() > new Date(link.expiration)) {
      return res.status(410).json({ message: 'Link has expired' });
    }
    
    // Log analytics
    const analyticsData = {
      linkId: link._id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer') || 'direct',
      clickedAt: new Date(),
    };
    
    await Analytics.create(analyticsData);
    
    // Increment click count
    await Link.findByIdAndUpdate(link._id, {
      $inc: { clicks: 1 },
      lastClicked: new Date(),
    });
    
    // Redirect to original URL
    res.redirect(301, link.originalUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ message: 'Server error during redirect' });
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quicklink-pro')
.then(() => {
  console.log('✅ Connected to MongoDB');
  // Start server - listen on all interfaces for Render
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 QuickLink Pro API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  mongoose.connection.close(() => {
    console.log('📴 MongoDB connection closed.');
    process.exit(0);
  });
});

module.exports = app;
